-- Migration to rename Job Order Detail Tables (Removing 'job_order_' prefix)

RENAME TABLE job_order_export_details TO export_details;
RENAME TABLE job_order_import_details TO import_details;
RENAME TABLE job_order_trucking_details TO trucking_details;
RENAME TABLE job_order_trucking_containers TO trucking_containers;
