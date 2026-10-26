/** Columns the public (anon) role may read. Must stay in sync with the column-level GRANT in the migration. */
export const PROPERTY_COLUMNS =
  "id,slug,property_code,title,transaction_type,property_type,city,area_id,area_name,compound,neighborhood,price,currency,area_sqm,bedrooms,bathrooms,finishing,furnishing,floor,delivery_status,description,features,images,listing_source,availability_status,last_availability_check,legal_review_status,payment_plan_note,is_demo,published_at";

export const PROJECT_COLUMNS =
  "id,slug,name,developer,area_id,area_name,city,description,delivery_status,payment_plan_note,images,is_demo,is_primary_sales,unit_types,published_at";

export const CONTACT_COLUMNS =
  "whatsapp_number,phone,email,address,instagram_url,facebook_url,linkedin_url";
