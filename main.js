const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { PDFDocument } = require('pdf-lib');

// PDFRest API configuration
const API_KEY = '3165d6fc-954f-4f69-b5b8-1b2ce8a43432'; // Replace with your actual API key
const BASE_URL = 'https://api.pdfrest.com';

/**
 * Combined script to convert XFA form to AcroForm and fill it with data
 * 
 * @param {string} inputFilePath - Path to the input XFA PDF file
 * @param {string} outputFilePath - Path where the filled AcroForm PDF will be saved
 * @param {Object} formData - Object with field names as keys and field values as values
 * @param {boolean} flatten - Whether to flatten the form after filling (default: false)
 * @returns {Promise<string>} - Path to the filled PDF file
 */
async function convertAndFillPDF(inputFilePath, outputFilePath, formData, flatten = false) {
  try {
    console.log(`Starting process for file: ${inputFilePath}`);
    
    // Step 1: Validate input file exists
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input file not found: ${inputFilePath}`);
    }
    
    // Create a temporary file path for the converted AcroForm
    const tempFilePath = `${path.dirname(outputFilePath)}/temp_${path.basename(outputFilePath)}`;
    
    // Step 2: Convert XFA to AcroForm using PDFRest API
    console.log('Converting XFA form to AcroForm...');
    await convertXfaToAcroForm(inputFilePath, tempFilePath);
    console.log(`Conversion successful! AcroForm saved to: ${tempFilePath}`);
    
    // Step 3: Fill the AcroForm with data
    console.log('Filling AcroForm with data...');
    await fillAcroForm(tempFilePath, outputFilePath, formData, flatten);
    console.log(`Form filled successfully! Final PDF saved to: ${outputFilePath}`);
    
    // Step 4: Clean up temporary file
    fs.unlinkSync(tempFilePath);
    console.log('Temporary files cleaned up');
    
    return outputFilePath;
  } catch (error) {
    console.error('Error in convertAndFillPDF:', error);
    throw error;
  }
}

/**
 * Converts an XFA form PDF to an AcroForm PDF using PDFRest API
 * 
 * @param {string} inputFilePath - Path to the input XFA PDF file
 * @param {string} outputFilePath - Path where the converted AcroForm PDF will be saved
 * @returns {Promise<void>}
 */
async function convertXfaToAcroForm(inputFilePath, outputFilePath) {
  try {
    // Create form data with the PDF file
    const formData = new FormData();
    formData.append('file', fs.createReadStream(inputFilePath));
    
    // Make API request to convert XFA to AcroForm
    const response = await axios.post(
      `${BASE_URL}/pdf-with-acroforms`,
      formData,
      {
        headers: {
          'Api-Key': API_KEY,
          ...formData.getHeaders(),
        },
        responseType: 'json',
      }
    );
    
    // Get the output URL from the response
    const outputUrl = response.data.outputUrl;
    
    // Download the file from the URL
    const fileResponse = await axios.get(outputUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Api-Key': API_KEY
      }
    });
    
    // Save the downloaded file
    fs.writeFileSync(outputFilePath, fileResponse.data);
  } catch (error) {
    if (error.response) {
      // API error response
      const errorMessage = Buffer.from(error.response.data).toString();
      throw new Error(`API Error (${error.response.status}): ${errorMessage}`);
    } else {
      // Network error or other issues
      throw new Error(`Error during conversion: ${error.message}`);
    }
  }
}

/**
 * Fill an AcroForm PDF with provided form field values
 * 
 * @param {string} inputFilePath - Path to the input AcroForm PDF file
 * @param {string} outputFilePath - Path where the filled PDF will be saved
 * @param {Object} fieldValues - Object with field names as keys and field values as values
 * @param {boolean} flatten - Whether to flatten the form after filling
 * @returns {Promise<void>}
 */
async function fillAcroForm(inputFilePath, outputFilePath, fieldValues, flatten = false) {
  try {
    // Read the PDF file
    const pdfBytes = fs.readFileSync(inputFilePath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the form from the document
    const form = pdfDoc.getForm();
    
    // Get all form fields
    const fields = form.getFields();
    console.log(`Found ${fields.length} fields in the form`);
    
    // Fill in the form fields
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
    if (flatten) {
      form.flatten();
      console.log('Form has been flattened (made non-editable)');
    }
    
    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputFilePath, filledPdfBytes);
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

/**
 * Batch process multiple files
 * 
 * @param {string} inputDir - Directory containing XFA PDFs
 * @param {string} outputDir - Directory where filled PDFs will be saved
 * @param {Object} formData - Form data to use for filling the forms
 * @param {boolean} flatten - Whether to flatten forms after filling
 * @returns {Promise<void>}
 */
async function batchProcess(inputDir, outputDir, formData, flatten = false) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get list of PDF files
    const files = fs.readdirSync(inputDir)
      .filter(file => file.toLowerCase().endsWith('.pdf'));
    
    if (files.length === 0) {
      console.log('No PDF files found in the input directory.');
      return;
    }
    
    console.log(`Found ${files.length} PDF files. Starting batch conversion and filling...`);
    
    // Process each file
    for (const file of files) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, `filled_${file}`);
      
      try {
        await convertAndFillPDF(inputPath, outputPath, formData, flatten);
        console.log(`Successfully processed: ${file}`);
      } catch (error) {
        console.error(`Failed to process ${file}: ${error.message}`);
        // Continue with next file
      }
    }
    
    console.log('Batch processing completed.');
  } catch (error) {
    console.error('Error during batch processing:', error);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
Usage:
  Single file:  node script.js -s <inputPdf> <outputPdf> <dataJsonFile> [flatten]
  Batch mode:   node script.js -b <inputDirectory> <outputDirectory> <dataJsonFile> [flatten]
  List fields:  node script.js -l <inputPdf>
    
  flatten: Use 'true' to make form non-editable after filling
    `);
    process.exit(1);
  }
  
  const mode = args[0];
  
  if (mode === '-s' && args.length >= 4) {
    const inputPdf = args[1];
    const outputPdf = args[2];
    const dataJsonFile = args[3];
    const flatten = args[4] === 'true';
    
    // Load form data from JSON file
    const formData = JSON.parse(fs.readFileSync(dataJsonFile, 'utf8'));
    
    convertAndFillPDF(inputPdf, outputPdf, formData, flatten)
      .catch(() => process.exit(1));
  } else if (mode === '-b' && args.length >= 4) {
    const inputDir = args[1];
    const outputDir = args[2];
    const dataJsonFile = args[3];
    const flatten = args[4] === 'true';
    
    // Load form data from JSON file
    const formData = JSON.parse(fs.readFileSync(dataJsonFile, 'utf8'));
    
    batchProcess(inputDir, outputDir, formData, flatten)
      .catch(() => process.exit(1));
  } else if (mode === '-l' && args.length >= 2) {
    listFormFields(args[1])
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
      .catch(() => process.exit(1));
  } else {
    console.log('Invalid arguments. Use -s for single file, -b for batch mode, or -l to list fields.');
    process.exit(1);
  }
}

module.exports = {
  convertAndFillPDF,
  convertXfaToAcroForm,
  fillAcroForm,
  listFormFields,
  batchProcess
};