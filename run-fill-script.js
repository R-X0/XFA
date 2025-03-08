const fs = require('fs');

// Create the sample data file
const sampleData = {
  "topmostSubform[0].Page1[0].TaxpayerName[0]": "John Q. Taxpayer",
  "topmostSubform[0].Page1[0].TaxpayerAddress[0]": "123 Main Street, Anytown, CA 90210",
  "topmostSubform[0].Page1[0].TaxpayerIDSSN[0]": "123-45-6789",
  "topmostSubform[0].Page1[0].TaxpayerIDEIN[0]": "",
  "topmostSubform[0].Page1[0].TaxpayerTelephone[0]": "555-123-4567",
  "topmostSubform[0].Page1[0].TaxpayerPlanNumber[0]": "",
  "topmostSubform[0].Page1[0].RepresentativesName1[0]": "Jane Smith, CPA",
  "topmostSubform[0].Page1[0].RepresentativesAddress1[0]": "456 Tax Lane, Suite 300, Taxville, CA 92101",
  "topmostSubform[0].Page1[0].SentCopies1[0]": true,
  "topmostSubform[0].Page1[0].CAFNumber1[0]": "0123456789R",
  "topmostSubform[0].Page1[0].PTIN1[0]": "P12345678",
  "topmostSubform[0].Page1[0].TelephoneNo1[0]": "555-987-6543",
  "topmostSubform[0].Page1[0].FaxNo1[0]": "555-987-6544",
  "topmostSubform[0].Page1[0].NewAddress1[0]": false,
  "topmostSubform[0].Page1[0].NewTelephoneNo1[0]": false,
  "topmostSubform[0].Page1[0].NewFaxNo1[0]": false,
  "topmostSubform[0].Page1[0].Table_Line3[0].BodyRow1[0].Description1[0]": "Income Tax",
  "topmostSubform[0].Page1[0].Table_Line3[0].BodyRow1[0].TaxForm1[0]": "1040",
  "topmostSubform[0].Page1[0].Table_Line3[0].BodyRow1[0].Years1[0]": "2022, 2023, 2024",
  "topmostSubform[0].Page1[0].Table_Line3[0].BodyRow2[0].Description2[0]": "Civil Penalties",
  "topmostSubform[0].Page1[0].Table_Line3[0].BodyRow2[0].TaxForm2[0]": "All",
  "topmostSubform[0].Page1[0].Table_Line3[0].BodyRow2[0].Years2[0]": "2022, 2023, 2024",
  "topmostSubform[0].Page1[0].AccessRecords[0]": true,
  "topmostSubform[0].Page1[0].AuthorizeDisclosure[0]": true,
  "topmostSubform[0].Page1[0].SubtituteOrAdd[0]": true,
  "topmostSubform[0].Page1[0].SignReturn[0]": true,
  "topmostSubform[0].Page2[0].PrintName[0]": "Jane Smith",
  "topmostSubform[0].Page2[0].PrintNameTaxpayer[0]": "John Q. Taxpayer",
  "topmostSubform[0].Page2[0].Table_PartII[0].BodyRow1[0].Designation1[0]": "CPA",
  "topmostSubform[0].Page2[0].Table_PartII[0].BodyRow1[0].Jurisdiction1[0]": "CA",
  "topmostSubform[0].Page2[0].Table_PartII[0].BodyRow1[0].Bar1[0]": "12345",
  "topmostSubform[0].Page2[0].Table_PartII[0].BodyRow1[0].Date1[0]": "03/08/2025"
};

// Write the sample data to a file
fs.writeFileSync('form2848-data.json', JSON.stringify(sampleData, null, 2));

console.log('Created form2848-data.json with sample data');
console.log('');
console.log('Now run the command:');
console.log('node acroform-filler.js fill form2848_acroform.pdf filled_form2848.pdf form2848-data.json');