# FaceCompare Application

FaceCompare is a face recognition application developed using AWS Rekognition and React. It offers features such as image uploading, face comparison, and extracting information from IDs.

## Features

- Upload and manage images
- Face comparison (1-to-1 and 1-to-many)
- Extract ID information (using OpenAI API)
- Display image gallery
- Set profile image
- Invoice information extraction

## Technology Stack

- React
- AWS SDK (S3, Rekognition)
- Material-UI
- OpenAI API

## Setup

1. Clone the repository:

   ```
   git clone https://github.com/studioudjat/facecompare.git
   cd facecompare
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Copy the `.env.example` file to `.env` and set the required environment variables:

   ```
   cp .env.example .env
   ```

   Open the `.env` file in a text editor and set appropriate values for the following variables:

   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_REGION
   - S3_BUCKET_NAME
   - OPENAI_API_KEY

4. Start the application:
   ```
   npm start
   ```

## Usage

1. **Upload images**: Upload images on the "Add" page. This functionality is handled by the `AddImage.js` component.
2. **View images**: View the uploaded images on the "List" page, managed by `ListImages.js`.
3. **Compare faces**: On the "Match" page, compare a profile image with other images using `MatchFaces.js` for 1-to-1 face comparison.
4. **1-to-1 Face Comparison**: Compare two images on the "Compare" page, implemented in `CompareFaces.js`.
5. **Extract ID information**: On the "Extract" page, extract information from ID images using the OpenAI API, as implemented in `ExtractIdInfo.js`.
6. **Process invoices**: Upload and process invoice PDFs on the "Process" page to extract invoice data using AWS Textract, handled by `InvoiceProcess.js`.

## Key Component Overview

- **`AddImage.js`**: Allows users to upload and preview images.
- **`CompareFaces.js`**: Compares two faces using AWS Rekognition.
- **`MatchFaces.js`**: Compares the profile image with other images.
- **`ExtractIdInfo.js`**: Extracts information from ID images using the OpenAI API.
- **`InvoiceProcess.js`**: Processes invoices, extracting details like amounts and dates using AWS Textract.
- **`s3Service.js`**: Provides backend services for uploading and deleting files in AWS S3.

## Notes

- This application uses AWS services and the OpenAI API. Charges may apply for usage.
- Be cautious when handling personal or sensitive information.
- Implement proper security measures when deploying in production.

## License

This project is licensed under the [MIT License](LICENSE).
