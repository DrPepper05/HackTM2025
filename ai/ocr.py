import boto3
from botocore.exceptions import ClientError
import logging
from io import BytesIO

# Assume these are configured via environment variables
AWS_REGION = "eu-central-1" # Or your chosen region
S3_BUCKET_NAME = "openarchive-documents"

s3_client = boto3.client('s3', region_name=AWS_REGION)
textract_client = boto3.client('textract', region_name=AWS_REGION)
sqs_client = boto3.client('sqs', region_name=AWS_REGION) # For publishing messages

logger = logging.getLogger(__name__)

async def process_document_for_ocr(document_id: str, s3_key: str):
    """
    Processes a document for OCR using AWS Textract.
    Assumes document_id and s3_key are passed from SQS message.
    """
    try:
        # 1. Get the document from S3
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        document_bytes = response['Body'].read()

        # 2. Call Textract
        # For hackathon, stick to detect_document_text for simplicity.
        # For PDFs, Textract can directly process S3 URIs asynchronously.
        # For images, we can send bytes directly.
        # If input is image:
        # textract_response = textract_client.detect_document_text(
        #     Document={'Bytes': document_bytes}
        # )
        # If input is PDF (and > 5MB or multi-page, async is better):
        # For hackathon, we can use start_document_text_detection
        # if we have time to implement polling or callbacks via SNS.
        # For simplicity for now, let's assume smaller documents or sync calls.
        # If document_bytes is large, consider streaming or S3 URI directly.

        # Simplified sync call for hackathon (assumes manageable file size for sync API):
        # For PDF/TIFF, analyze_document is better for forms/tables, detect_document_text for raw text.
        # For this hackathon, we'll keep it simple for speed and directly process bytes.
        # If your documents are often PDFs and large, you might need async Textract + SNS callback.

        # Example for image or single-page PDF (sync operation up to 10MB)
        textract_response = textract_client.detect_document_text(
            Document={'Bytes': document_bytes}
        )

        extracted_text = ""
        for item in textract_response['Blocks']:
            if item['BlockType'] == 'LINE':
                extracted_text += item['Text'] + "\n"

        # 3. Store OCR text back to S3
        ocr_s3_key = f"documents/{document_id}/ocr_text/{document_id}_ocr.txt"
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=ocr_s3_key,
            Body=extracted_text.encode('utf-8'),
            ContentType='text/plain'
        )

        # 4. Update Document & DocumentFile records in PostgreSQL (via Document Service API or direct DB)
        # For hackathon, Enrichment Service might directly update DB or publish a message to Document Service
        # Let's assume direct DB update for speed in worker, or a message to Document Service.
        # Option 1: Direct DB update (if worker has DB access)
        # from your_db_module import update_document_ocr_data, create_document_file
        # await update_document_ocr_data(document_id, ocr_s3_key)
        # await create_document_file(document_id, 'ocr_text', ocr_s3_key, 'text/plain', len(extracted_text.encode('utf-8')), 'SHA256', 'mock_checksum')

        # Option 2: Publish message to SQS for Document Service to update (cleaner microservice separation)
        # sqs_client.send_message(
        #     QueueUrl=YOUR_DOCUMENT_UPDATE_SQS_QUEUE_URL,
        #     MessageBody=json.dumps({
        #         "document_id": document_id,
        #         "action": "UPDATE_OCR",
        #         "ocr_s3_key": ocr_s3_key,
        #         "ocr_text_content": extracted_text[:1000] # Maybe send a snippet or just the key
        #     })
        # )
        logger.info(f"OCR processed for document {document_id}, text saved to {ocr_s3_key}")

        # 5. Publish to SQS to trigger PII/classification
        sqs_client.send_message(
            QueueUrl="your-enrichment-complete-queue-url", # A new queue for subsequent steps
            MessageBody=json.dumps({
                "document_id": document_id,
                "ocr_s3_key": ocr_s3_key,
                "event_type": "DocumentOCRProcessed"
            })
        )

    except ClientError as e:
        logger.error(f"Textract or S3 error for document {document_id}: {e}")
        # Handle error: move to DLQ, update document status to FAILED_OCR etc.
        raise
    except Exception as e:
        logger.error(f"Unexpected error during OCR for document {document_id}: {e}")
        raise