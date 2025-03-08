const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

/**
 * Fill an AcroForm PDF with provided form field values
 * 
 * @param {string} inputFilePath - Path to the input AcroForm PDF file
 * @param {string} outputFilePath - Path where the filled PDF will be saved
 * @param {Object} fieldValues - Object with field names as keys and field values as values
 * @returns {Promise<void>}
 */
async function fillAcroForm(inputFilePath, outputFilePath, fieldValues) {
  try {
    // Validate file existence
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input file not found: ${inputFilePath}`);
    }

    console.log('Starting to fill AcroForm...');
    
    // Read the PDF file
    const pdfBytes = fs.readFileSync(inputFilePath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the form from the document
    const form = pdfDoc.getForm();

    // Get all form fields
    const fields = form.getFields();
    console.log(`Found ${fields.length} fields in the form`);
    
    // Log field names if in debug mode
    if (process.env.DEBUG === 'true') {
      fields.forEach(field => {
        console.log(`Field name: ${field.getName()}`);
      });
    }
    
    // Fill in the form fields
    console.log('Filling form fields...');
    let filledCount = 0;
    
    for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
      try {
        // Get the field by name
        const field = form.getField(fieldName);
        
        // Check field type and set appropriate value
        if (field.constructor.name === 'PDFTextField') {
          field.setText(fieldValue.toString());
          filledCount++;
        } else if (field.constructor.name === 'PDFCheckBox') {
          if (fieldValue === true) {
            field.check();
          } else {
            field.uncheck();
          }
          filledCount++;
        } else if (field.constructor.name === 'PDFRadioGroup') {
          field.select(fieldValue.toString());
          filledCount++;
        } else if (field.constructor.name === 'PDFDropdown') {
          field.select(fieldValue.toString());
          filledCount++;
        } else {
          console.warn(`Unsupported field type for field: ${fieldName}`);
        }
      } catch (error) {
        console.warn(`Error setting field '${fieldName}': ${error.message}`);
      }
    }
    
    console.log(`Successfully filled ${filledCount} fields`);
    
    // Flatten the form if specified (makes it non-editable)
    if (process.env.FLATTEN === 'true') {
      form.flatten();
      console.log('Form has been flattened (made non-editable)');
    }
    
    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFilePath, filledPdfBytes);
    
    console.log(`Filled PDF saved to: ${outputFilePath}`);
  } catch (error) {
    console.error('Error filling AcroForm:', error);
    throw error;
  }
}

/**
 * List all form fields in a PDF to help identify field names
 * 
 * @param {string} inputFilePath - Path to the PDF file
 * @returns {Promise<Array>} - Array of field names and types
 */
async function listFormFields(inputFilePath) {
  try {
    // Validate file existence
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input file not found: ${inputFilePath}`);
    }
    
    // Read the PDF file
    const pdfBytes = fs.readFileSync(inputFilePath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the form from the document
    const form = pdfDoc.getForm();
    
    // Get all form fields
    const fields = form.getFields();
    
    // Create an array of field info
    const fieldInfo = fields.map(field => ({
      name: field.getName(),
      type: field.constructor.name.replace('PDF', '')
    }));
    
    return fieldInfo;
  } catch (error) {
    console.error('Error listing form fields:', error);
    throw error;
  }
}

// Example usage for form 2848 (IRS Power of Attorney)
// This is an example - fields will need to be adjusted for the actual form
const form2848Data = {
  // Taxpayer information
  'f1_1': 'John Doe', // Taxpayer name
  'f1_2': '123-45-6789', // Taxpayer SSN or EIN
  'f1_3': '123 Main Street, Anytown, CA 90210', // Taxpayer address
  'f1_4': '555-123-4567', // Taxpayer phone
  
  // Representative information
  'f1_5': 'Jane Smith, Attorney', // Representative name
  'f1_6': 'P12345', // CAF No.
  'f1_7': '800-555-1234', // Phone
  'f1_8': 'jane@lawfirm.com', // Email
  
  // Check boxes (true = checked)
  'c1_1': true,  // Acts authorized - All matters
  
  // Description of matters
  'f1_13': 'Income Tax', // Type of Tax
  'f1_14': '1040', // Form Number
  'f1_15': '2022, 2023, 2024', // Year(s) or Period(s)
  
  // Signature fields (these may not work directly with pdf-lib, might need manual signing)
  'f1_16': 'John Doe', // Print name of taxpayer
};

// Example command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'fill' && args.length >= 3) {
    // node acroform-filler.js fill input.pdf output.pdf data.json
    const inputFile = args[1];
    const outputFile = args[2];
    const dataFile = args[3];
    
    let formData;
    if (dataFile) {
      // Load form data from JSON file
      formData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } else {
      // Use example data
      formData = form2848Data;
      console.log('Using example data (for Form 2848). For actual use, provide a JSON file with your data.');
    }
    
    fillAcroForm(inputFile, outputFile, formData)
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  } 
  else if (args[0] === 'list' && args.length >= 2) {
    // node acroform-filler.js list input.pdf
    const inputFile = args[1];
    
    listFormFields(inputFile)
      .then(fields => {
        console.log('Form Fields:');
        fields.forEach(field => {
          console.log(`- ${field.name} (${field.type})`);
        });
        
        // Generate example JSON template
        const templateData = {};
        fields.forEach(field => {
          if (field.type === 'TextField') {
            templateData[field.name] = '';
          } else if (field.type === 'CheckBox') {
            templateData[field.name] = false;
          } else if (field.type === 'RadioGroup' || field.type === 'Dropdown') {
            templateData[field.name] = '';
          }
        });
        
        console.log('\nExample JSON template:');
        console.log(JSON.stringify(templateData, null, 2));
      })
      .catch(err => {
        console.error('Error:', err);
        process.exit(1);
      });
  }
  else {
    console.log(`
Usage:
  List form fields:   node acroform-filler.js list <inputPdf>
  Fill form:          node acroform-filler.js fill <inputPdf> <outputPdf> [dataJsonFile]
    
Environment variables:
  DEBUG=true          Show detailed debugging information
  FLATTEN=true        Make form non-editable after filling
    `);
    process.exit(1);
  }
}

module.exports = {
  fillAcroForm,
  listFormFields
};