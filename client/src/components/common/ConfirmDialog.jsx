import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

export default function ConfirmDialog({ open, title, message, onConfirm, onClose }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title || 'ยืนยัน'}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message || 'คุณต้องการดำเนินการนี้ใช่หรือไม่?'}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button onClick={onConfirm} color="error" variant="contained">ยืนยัน</Button>
      </DialogActions>
    </Dialog>
  );
}
