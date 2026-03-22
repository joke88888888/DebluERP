function generateSKU({ brandCode, productionMethodCode, genderCode, modelCode, versionCode, categoryCode, colorCode, sizeCode }) {
  return `${brandCode}${productionMethodCode}${genderCode}${modelCode}${versionCode}${categoryCode}${colorCode}#${sizeCode}`;
}

module.exports = { generateSKU };
