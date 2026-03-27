const db = require('../config/db');
const { success, error } = require('../utils/responseHelper');

exports.getSummary = async (req, res) => {
  try {
    const [[{ total_customers }]] = await db.query('SELECT COUNT(*) as total_customers FROM customers');
    const [[{ total_sub_customers }]] = await db.query('SELECT COUNT(*) as total_sub_customers FROM sub_customers');
    const [[{ total_credit_limit }]] = await db.query('SELECT COALESCE(SUM(credit_limit), 0) as total_credit_limit FROM customer_credits');
    const [[{ customers_with_credit }]] = await db.query('SELECT COUNT(DISTINCT customer_id) as customers_with_credit FROM customer_credits WHERE credit_limit > 0');

    const [brandBreakdown] = await db.query(
      `SELECT b.id as brand_id, b.name as brand_name,
       COUNT(DISTINCT cc.customer_id) as customer_count,
       SUM(cc.credit_limit) as total_credit_limit,
       AVG(cc.credit_days) as avg_credit_days
       FROM customer_credits cc
       LEFT JOIN brands b ON cc.brand_id = b.id
       GROUP BY b.id, b.name ORDER BY total_credit_limit DESC`
    );

    const [statusBreakdown] = await db.query(
      "SELECT status, COUNT(*) as count FROM customers GROUP BY status"
    );

    return success(res, {
      total_customers,
      total_sub_customers,
      total_credit_limit,
      customers_with_credit,
      brandBreakdown,
      statusBreakdown,
    });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getCustomerList = async (req, res) => {
  try {
    const { q, status, page = 1, limit = 50 } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (q) { where += ' AND (c.company_name LIKE ? OR c.customer_code LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    if (status) { where += ' AND c.status = ?'; params.push(status); }

    const [rows] = await db.query(
      `SELECT c.id, c.customer_code, c.company_name, c.status, c.sales_zone,
       p.name_th as province_name,
       r.name_th as region_name,
       e.first_name as sales_first_name, e.last_name as sales_last_name,
       COALESCE((SELECT SUM(cc.credit_limit) FROM customer_credits cc WHERE cc.customer_id = c.id), 0) as total_credit_limit,
       COALESCE((SELECT COUNT(*) FROM customer_credits cc WHERE cc.customer_id = c.id), 0) as brand_count,
       COALESCE((SELECT COUNT(*) FROM sub_customers sc WHERE sc.parent_customer_id = c.id), 0) as sub_customer_count,
       c.customer_since
       FROM customers c
       LEFT JOIN provinces p ON c.province_id = p.id
       LEFT JOIN regions r ON c.region_id = r.id
       LEFT JOIN employees e ON c.sales_person_id = e.id
       ${where}
       ORDER BY c.customer_code
       LIMIT ${parseInt(limit)} OFFSET ${(parseInt(page) - 1) * parseInt(limit)}`,
      params
    );

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM customers c ${where}`, params);

    // Attach brand credits per customer
    const customerIds = rows.map(r => r.id);
    let creditsByCustomer = {};
    if (customerIds.length > 0) {
      const [credits] = await db.query(
        `SELECT cc.customer_id, cc.credit_limit, cc.credit_days, b.name as brand_name
         FROM customer_credits cc LEFT JOIN brands b ON cc.brand_id = b.id
         WHERE cc.customer_id IN (${customerIds.map(() => '?').join(',')})`,
        customerIds
      );
      for (const cr of credits) {
        if (!creditsByCustomer[cr.customer_id]) creditsByCustomer[cr.customer_id] = [];
        creditsByCustomer[cr.customer_id].push(cr);
      }
    }

    const data = rows.map(r => ({ ...r, credits: creditsByCustomer[r.id] || [] }));
    return res.json({ success: true, data, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getCustomerDetail = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, p.name_th as province_name, r.name_th as region_name,
       tc.company_name as transport_name,
       e.first_name as sales_first_name, e.last_name as sales_last_name
       FROM customers c
       LEFT JOIN provinces p ON c.province_id = p.id
       LEFT JOIN regions r ON c.region_id = r.id
       LEFT JOIN transport_companies tc ON c.transport_company_id = tc.id
       LEFT JOIN employees e ON c.sales_person_id = e.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return error(res, 'Not found', 404);

    const [contacts] = await db.query('SELECT * FROM customer_contacts WHERE customer_id = ? ORDER BY sort_order', [req.params.id]);
    const [credits] = await db.query(
      `SELECT cc.*, b.name as brand_name FROM customer_credits cc
       LEFT JOIN brands b ON cc.brand_id = b.id WHERE cc.customer_id = ?`, [req.params.id]
    );
    const [bankAccounts] = await db.query('SELECT * FROM customer_bank_accounts WHERE customer_id = ? ORDER BY sort_order', [req.params.id]);
    const [documents] = await db.query('SELECT * FROM customer_documents WHERE customer_id = ? ORDER BY uploaded_at DESC', [req.params.id]);
    const [subCustomers] = await db.query(
      `SELECT sc.*, p.name_th as province_name,
       COALESCE((SELECT COUNT(*) FROM sub_customer_contacts scc WHERE scc.sub_customer_id = sc.id), 0) as contact_count
       FROM sub_customers sc
       LEFT JOIN provinces p ON sc.province_id = p.id
       WHERE sc.parent_customer_id = ? ORDER BY sc.sub_customer_code`, [req.params.id]
    );

    const totalCredit = credits.reduce((sum, cr) => sum + Number(cr.credit_limit), 0);

    return success(res, {
      ...rows[0],
      contacts, credits, bankAccounts, documents, subCustomers,
      totalCredit,
      paymentHistory: [],
      orderHistory: [],
    });
  } catch (err) {
    return error(res, err.message);
  }
};
