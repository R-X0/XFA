const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Your PDFRest API key
const API_KEY = '3165d6fc-954f-4f69-b5b8-1b2ce8a43432';
const BASE_URL = 'https://api.pdfrest.com';

/**
 * Converts an XFA form PDF to an AcroForm PDF
 * 
 * @param {string} inputFilePath - Path to the input XFA PDF file
 * @param {string} outputFilePath - Path where the converted AcroForm PDF will be saved
 * @returns {Promise<void>}
 */
async function convertXfaToAcroForm(inputFilePath, outputFilePath) {
  try {
    // Validate file existence
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input file not found: ${inputFilePath}`);
    }

    console.log('Starting conversion from XFA to AcroForm...');
    
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
        // We need JSON response to get the output URL
        responseType: 'json',
      }
    );
    
    // Get the output URL from the response
    const outputUrl = response.data.outputUrl;
    console.log(`Conversion successful! Downloading file from: ${outputUrl}`);
    
    // Download the file from the URL
    const fileResponse = await axios.get(outputUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Api-Key': API_KEY
      }
    });
    
    // Save the downloaded file
    fs.writeFileSync(outputFilePath, fileResponse.data);
    
    console.log(`AcroForm PDF downloaded and saved to: ${outputFilePath}`);
  } catch (error) {
    if (error.response) {
      // API error response
      const errorMessage = Buffer.from(error.response.data).toString();
      console.error(`API Error (${error.response.status}): ${errorMessage}`);
    } else {
      // Network error or other issues
      console.error('Error during conversion:', error.message);
    }
    throw error;
  }
}

/**
 * Processes multiple files in a directory
 * 
 * @param {string} inputDir - Directory containing XFA PDFs
 * @param {string} outputDir - Directory where converted AcroForm PDFs will be saved
 * @returns {Promise<void>}
 */
async function batchProcess(inputDir, outputDir) {
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
    
    console.log(`Found ${files.length} PDF files. Starting batch conversion...`);
    
    // Process each file
    for (const file of files) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);
      
      try {
        await convertXfaToAcroForm(inputPath, outputPath);
        console.log(`Successfully converted: ${file}`);
      } catch (error) {
        console.error(`Failed to convert ${file}: ${error.message}`);
        // Continue with next file
      }
    }
    
    console.log('Batch processing completed.');
  } catch (error) {
    console.error('Error during batch processing:', error.message);
    throw error;
  }
}

// Example usage for a single file conversion
// convertXfaToAcroForm('./input.pdf', './output.pdf')
//   .catch(err => console.error('Conversion failed:', err));

// Example usage for batch processing
// batchProcess('./xfa-forms', './acro-forms')
//   .catch(err => console.error('Batch processing failed:', err));

module.exports = {
  convertXfaToAcroForm,
  batchProcess
};

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
Usage:
  Single file: node script.js -s <inputFile> <outputFile>
  Batch mode:  node script.js -b <inputDirectory> <outputDirectory>
    `);
    process.exit(1);
  }
  
  const mode = args[0];
  
  if (mode === '-s' && args.length >= 3) {
    convertXfaToAcroForm(args[1], args[2])
      .catch(() => process.exit(1));
  } else if (mode === '-b' && args.length >= 3) {
    batchProcess(args[1], args[2])
      .catch(() => process.exit(1));
  } else {
    console.log('Invalid arguments. Use -s for single file or -b for batch mode.');
    process.exit(1);
  }
}