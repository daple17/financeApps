-- Sample Master Data (data contoh untuk demo / testing)
-- Idempotent: aman dijalankan berulang kali (INSERT IGNORE + NOT EXISTS)
-- Seluruh nama perusahaan & orang bersifat fiktif.

-- 1. Business Partners
INSERT IGNORE INTO business_partners (partner_code, partner_name, short_name, partner_type, email, phone, city, address, npwp, status, created_by) VALUES
('CUST-001', 'PT Sinar Jaya Elektronik', 'Sinar Jaya', 'COMPANY', 'logistik@sinarjaya-elektronik.co.id', '021-4567-8901', 'Jakarta Utara', 'Jl. Yos Sudarso Kav. 12, Sunter, Jakarta Utara 14350', '01.234.567.8-041.000', 'ACTIVE', 1),
('CUST-002', 'PT Agro Nusantara Makmur', 'Agro Nusantara', 'COMPANY', 'export@agronusantara.co.id', '031-3290-1122', 'Surabaya', 'Jl. Rungkut Industri III No. 45, Surabaya 60293', '02.345.678.9-609.000', 'ACTIVE', 1),
('CUST-003', 'CV Maju Bersama Tekstil', 'Maju Bersama', 'COMPANY', 'admin@majubersamatekstil.com', '022-7531-4488', 'Bandung', 'Jl. Soekarno-Hatta No. 210, Bandung 40235', '03.456.789.0-424.000', 'ACTIVE', 1),
('CUST-004', 'PT Samudra Kimia Indonesia', 'Samudra Kimia', 'COMPANY', 'ppic@samudrakimia.co.id', '021-8990-2233', 'Bekasi', 'Kawasan Industri Jababeka Blok F-8, Cikarang, Bekasi 17530', '04.567.890.1-413.000', 'ACTIVE', 1),
('CUST-005', 'PT Furnindo Kayu Lestari', 'Furnindo', 'COMPANY', 'shipping@furnindo.co.id', '024-7608-5511', 'Semarang', 'Jl. Arteri Yos Sudarso No. 8, Semarang 50174', '05.678.901.2-511.000', 'INACTIVE', 1),
('VEND-001', 'PT Trans Logistik Mandiri', 'Trans Logistik', 'COMPANY', 'ops@translogistik.co.id', '021-4401-7788', 'Jakarta Utara', 'Jl. Raya Cilincing No. 77, Jakarta Utara 14130', '06.789.012.3-045.000', 'ACTIVE', 1),
('VEND-002', 'CV Bintang Depo Container', 'Bintang Depo', 'COMPANY', 'depo@bintangdepo.com', '021-4393-1200', 'Jakarta Utara', 'Jl. Jampea No. 3, Koja, Jakarta Utara 14260', '07.890.123.4-046.000', 'ACTIVE', 1),
('VEND-003', 'PT Gudang Berikat Cakung', 'GB Cakung', 'COMPANY', 'cs@gbcakung.co.id', '021-4682-9900', 'Jakarta Timur', 'Jl. Raya Cakung Cilincing Km. 3, Jakarta Timur 13910', '08.901.234.5-004.000', 'ACTIVE', 1),
('VEND-004', 'Budi Santoso', 'Pak Budi', 'INDIVIDUAL', 'budi.santoso.truk@gmail.com', '0812-8877-6655', 'Bekasi', 'Perum Harapan Indah Blok C2 No. 15, Bekasi 17214', NULL, 'ACTIVE', 1),
('VEND-005', 'PT Bahari Bongkar Muat', 'Bahari BM', 'COMPANY', 'operasional@baharibm.co.id', '031-3520-4411', 'Surabaya', 'Jl. Perak Timur No. 120, Surabaya 60165', '09.012.345.6-613.000', 'ACTIVE', 1),
('AGEN-001', 'PT Nusa Lines Agency', 'Nusa Agency', 'COMPANY', 'booking@nusalines-agency.co.id', '021-4301-5566', 'Jakarta Utara', 'Jl. Enggano No. 5, Tanjung Priok, Jakarta Utara 14310', '10.123.456.7-042.000', 'ACTIVE', 1),
('SHIP-001', 'PT Samudera Biru Lines', 'Samudera Biru', 'COMPANY', 'cs@samuderabiru-lines.com', '021-2938-4400', 'Jakarta Pusat', 'Gedung Maritim Lt. 9, Jl. Medan Merdeka Timur No. 11, Jakarta Pusat 10110', '11.234.567.8-073.000', 'ACTIVE', 1),
('MIX-001', 'PT Mitra Karya Logistik', 'Mitra Karya', 'COMPANY', 'partnership@mitrakarya-log.co.id', '021-5890-3344', 'Tangerang', 'Jl. Raya Serang Km. 18, Cikupa, Tangerang 15710', '12.345.678.9-402.000', 'ACTIVE', 1);

-- 2. Business Partner Roles (Customer / Vendor / Shipper / Agent / Shipping Company)
INSERT IGNORE INTO business_partner_roles (partner_id, role)
SELECT bp.id, r.role FROM business_partners bp
JOIN (
  SELECT 'CUST-001' AS code, 'CUSTOMER' AS role UNION ALL
  SELECT 'CUST-001', 'SHIPPER' UNION ALL
  SELECT 'CUST-002', 'CUSTOMER' UNION ALL
  SELECT 'CUST-002', 'SHIPPER' UNION ALL
  SELECT 'CUST-003', 'CUSTOMER' UNION ALL
  SELECT 'CUST-004', 'CUSTOMER' UNION ALL
  SELECT 'CUST-004', 'SHIPPER' UNION ALL
  SELECT 'CUST-005', 'CUSTOMER' UNION ALL
  SELECT 'VEND-001', 'VENDOR' UNION ALL
  SELECT 'VEND-002', 'VENDOR' UNION ALL
  SELECT 'VEND-003', 'VENDOR' UNION ALL
  SELECT 'VEND-004', 'VENDOR' UNION ALL
  SELECT 'VEND-005', 'VENDOR' UNION ALL
  SELECT 'AGEN-001', 'SHIPPING_AGENT' UNION ALL
  SELECT 'AGEN-001', 'VENDOR' UNION ALL
  SELECT 'SHIP-001', 'SHIPPING_COMPANY' UNION ALL
  SELECT 'SHIP-001', 'VENDOR' UNION ALL
  SELECT 'MIX-001', 'CUSTOMER' UNION ALL
  SELECT 'MIX-001', 'VENDOR'
) r ON r.code = bp.partner_code;

-- 3. Business Partner Contacts (PIC)
INSERT INTO business_partner_contacts (partner_id, name, position, phone, email, is_primary, status)
SELECT bp.id, c.name, c.position, c.phone, c.email, c.is_primary, 'ACTIVE'
FROM business_partners bp
JOIN (
  SELECT 'CUST-001' AS code, 'Rina Kartika' AS name, 'Logistics Manager' AS position, '0811-1234-501' AS phone, 'rina.k@sinarjaya-elektronik.co.id' AS email, TRUE AS is_primary UNION ALL
  SELECT 'CUST-001', 'Andi Pratama', 'Staff Exim', '0811-1234-502', 'andi.p@sinarjaya-elektronik.co.id', FALSE UNION ALL
  SELECT 'CUST-002', 'Dewi Lestari', 'Export Supervisor', '0812-3300-701', 'dewi.l@agronusantara.co.id', TRUE UNION ALL
  SELECT 'CUST-003', 'Hendra Wijaya', 'Owner', '0813-2200-115', 'hendra@majubersamatekstil.com', TRUE UNION ALL
  SELECT 'CUST-004', 'Siti Rahmawati', 'PPIC Manager', '0815-7788-990', 'siti.r@samudrakimia.co.id', TRUE UNION ALL
  SELECT 'CUST-005', 'Yusuf Hidayat', 'Shipping Coordinator', '0817-6655-443', 'yusuf@furnindo.co.id', TRUE UNION ALL
  SELECT 'VEND-001', 'Agus Setiawan', 'Kepala Operasional', '0812-9090-111', 'agus.s@translogistik.co.id', TRUE UNION ALL
  SELECT 'VEND-002', 'Joko Susilo', 'Admin Depo', '0819-4433-221', 'joko@bintangdepo.com', TRUE UNION ALL
  SELECT 'VEND-003', 'Maya Anggraini', 'Customer Service', '0821-5566-778', 'maya.a@gbcakung.co.id', TRUE UNION ALL
  SELECT 'VEND-004', 'Budi Santoso', 'Pemilik Armada', '0812-8877-6655', 'budi.santoso.truk@gmail.com', TRUE UNION ALL
  SELECT 'VEND-005', 'Rudi Hartono', 'Mandor Lapangan', '0822-1122-334', 'rudi.h@baharibm.co.id', TRUE UNION ALL
  SELECT 'AGEN-001', 'Lina Marlina', 'Booking Officer', '0813-9988-776', 'lina@nusalines-agency.co.id', TRUE UNION ALL
  SELECT 'SHIP-001', 'Fajar Nugroho', 'Sales Executive', '0811-2468-135', 'fajar.n@samuderabiru-lines.com', TRUE UNION ALL
  SELECT 'MIX-001', 'Teguh Prasetyo', 'Business Development', '0818-1357-246', 'teguh.p@mitrakarya-log.co.id', TRUE
) c ON c.code = bp.partner_code
WHERE NOT EXISTS (
  SELECT 1 FROM business_partner_contacts x WHERE x.partner_id = bp.id AND x.name = c.name
);

-- 4. Ports
INSERT IGNORE INTO ports (port_code, port_name, port_type, trade_scope, country_id, city, un_locode, address, status, created_by)
SELECT p.code, p.name, p.ptype, p.scope, co.id, p.city, p.locode, p.address, 'ACTIVE', 1
FROM (
  SELECT 'IDTPP' AS code, 'Pelabuhan Tanjung Priok' AS name, 'SEA_PORT' AS ptype, 'BOTH' AS scope, 'ID' AS country, 'Jakarta' AS city, 'IDTPP' AS locode, 'Jl. Raya Pelabuhan No. 9, Tanjung Priok, Jakarta Utara' AS address UNION ALL
  SELECT 'IDSUB', 'Pelabuhan Tanjung Perak', 'SEA_PORT', 'BOTH', 'ID', 'Surabaya', 'IDSUB', 'Jl. Perak Timur No. 610, Surabaya' UNION ALL
  SELECT 'IDBLW', 'Pelabuhan Belawan', 'SEA_PORT', 'BOTH', 'ID', 'Medan', 'IDBLW', 'Jl. Sumatera No. 1, Belawan, Medan' UNION ALL
  SELECT 'IDSRG', 'Pelabuhan Tanjung Emas', 'SEA_PORT', 'BOTH', 'ID', 'Semarang', 'IDSRG', 'Jl. Coaster No. 10, Semarang' UNION ALL
  SELECT 'IDMAK', 'Pelabuhan Makassar (Soekarno-Hatta)', 'SEA_PORT', 'DOMESTIC', 'ID', 'Makassar', 'IDMAK', 'Jl. Soekarno No. 1, Makassar' UNION ALL
  SELECT 'IDCGK', 'Bandara Soekarno-Hatta (Cargo)', 'AIRPORT', 'BOTH', 'ID', 'Tangerang', 'IDCGK', 'Area Kargo Bandara Soekarno-Hatta, Tangerang' UNION ALL
  SELECT 'IDCKR', 'Cikarang Dry Port', 'INLAND_PORT', 'INTERNATIONAL', 'ID', 'Bekasi', 'IDCKR', 'Jl. Dry Port Raya, Jababeka, Cikarang, Bekasi' UNION ALL
  SELECT 'SGSIN', 'Port of Singapore', 'SEA_PORT', 'INTERNATIONAL', 'SG', 'Singapore', 'SGSIN', NULL UNION ALL
  SELECT 'MYPKG', 'Port Klang', 'SEA_PORT', 'INTERNATIONAL', 'MY', 'Port Klang', 'MYPKG', NULL UNION ALL
  SELECT 'CNSHA', 'Port of Shanghai', 'SEA_PORT', 'INTERNATIONAL', 'CN', 'Shanghai', 'CNSHA', NULL UNION ALL
  SELECT 'JPTYO', 'Port of Tokyo', 'SEA_PORT', 'INTERNATIONAL', 'JP', 'Tokyo', 'JPTYO', NULL UNION ALL
  SELECT 'NLRTM', 'Port of Rotterdam', 'SEA_PORT', 'INTERNATIONAL', 'NL', 'Rotterdam', 'NLRTM', NULL
) p
JOIN countries co ON co.country_code = p.country;

-- 5. Warehouses
INSERT IGNORE INTO warehouses (warehouse_code, warehouse_name, warehouse_type, country_id, city, address, contact_person, phone, email, business_partner_id, status, created_by)
SELECT w.code, w.name, w.wtype, co.id, w.city, w.address, w.pic, w.phone, w.email, bp.id, 'ACTIVE', 1
FROM (
  SELECT 'WH-JKT-01' AS code, 'Gudang Utama Cilincing' AS name, 'OWN' AS wtype, 'Jakarta Utara' AS city, 'Jl. Cilincing Raya No. 88, Jakarta Utara' AS address, 'Bambang Irawan' AS pic, '021-4400-1001' AS phone, 'wh.cilincing@orgfinance.com' AS email, NULL AS partner UNION ALL
  SELECT 'WH-SBY-01', 'Gudang Cabang Margomulyo', 'OWN', 'Surabaya', 'Jl. Margomulyo Indah Blok B-12, Surabaya', 'Eko Prasetyo', '031-7490-2002', 'wh.surabaya@orgfinance.com', NULL UNION ALL
  SELECT 'WH-BND-01', 'Gudang Berikat Cakung', 'BONDED', 'Jakarta Timur', 'Jl. Raya Cakung Cilincing Km. 3, Jakarta Timur', 'Maya Anggraini', '021-4682-9900', 'cs@gbcakung.co.id', 'VEND-003' UNION ALL
  SELECT 'WH-CUS-01', 'Gudang PT Sinar Jaya Sunter', 'CUSTOMER', 'Jakarta Utara', 'Jl. Yos Sudarso Kav. 12, Sunter, Jakarta Utara', 'Rina Kartika', '0811-1234-501', 'rina.k@sinarjaya-elektronik.co.id', 'CUST-001' UNION ALL
  SELECT 'WH-CUS-02', 'Gudang PT Samudra Kimia Cikarang', 'CUSTOMER', 'Bekasi', 'Kawasan Industri Jababeka Blok F-8, Cikarang', 'Siti Rahmawati', '0815-7788-990', 'siti.r@samudrakimia.co.id', 'CUST-004' UNION ALL
  SELECT 'WH-VEN-01', 'Depo Container Bintang Koja', 'VENDOR', 'Jakarta Utara', 'Jl. Jampea No. 3, Koja, Jakarta Utara', 'Joko Susilo', '0819-4433-221', 'depo@bintangdepo.com', 'VEND-002' UNION ALL
  SELECT 'WH-PUB-01', 'Gudang Umum Marunda Center', 'PUBLIC', 'Bekasi', 'Kawasan Marunda Center Blok J, Bekasi', 'Surya Darmawan', '021-2948-3300', 'info@marundacenter-wh.com', NULL
) w
JOIN countries co ON co.country_code = 'ID'
LEFT JOIN business_partners bp ON bp.partner_code = w.partner;

-- 6. Logistics References (tambahan dari seed bawaan)
INSERT IGNORE INTO vehicle_types (code, name, description, capacity_weight_kg, capacity_volume_cbm) VALUES
('TRK-PICKUP', 'Pick Up', 'Kendaraan ringan untuk pengiriman kecil dalam kota', 1000, 3),
('TRK-TRONTON', 'Tronton', 'Truk 3 sumbu untuk muatan berat', 20000, 40),
('TRK-LOWBED', 'Lowbed', 'Trailer rendah untuk alat berat / project cargo', 40000, NULL);

INSERT IGNORE INTO container_types (code, name, size_ft, category, description) VALUES
('20OT', '20'' Open Top', '20', 'Open Top', 'Container atap terbuka untuk muatan tinggi'),
('40FR', '40'' Flat Rack', '40', 'Flat Rack', 'Container tanpa dinding samping untuk muatan oversize');

INSERT IGNORE INTO cargo_units (code, name, description) VALUES
('KG', 'Kilogram', 'Satuan berat'),
('CBM', 'Cubic Meter', 'Satuan volume'),
('DRUM', 'Drum', 'Kemasan drum / tong');

-- 7. Drivers
INSERT IGNORE INTO drivers (driver_code, driver_name, phone_number, license_number, license_type, license_expiry_date, employment_type, status, availability, notes, created_by) VALUES
('DRV-001', 'Slamet Riyadi', '0812-3456-7001', '1234-5678-000101', 'B2 Umum', '2027-08-17', 'INTERNAL', 'ACTIVE', 'AVAILABLE', 'Spesialis trailer & container 40ft', 1),
('DRV-002', 'Wahyu Hidayat', '0812-3456-7002', '1234-5678-000102', 'B1 Umum', '2027-03-21', 'INTERNAL', 'ACTIVE', 'AVAILABLE', NULL, 1),
('DRV-003', 'Dedi Kurniawan', '0812-3456-7003', '1234-5678-000103', 'B2 Umum', '2026-12-05', 'INTERNAL', 'ACTIVE', 'AVAILABLE', 'SIM akan habis Desember 2026', 1),
('DRV-004', 'Asep Saepudin', '0812-3456-7004', '1234-5678-000104', 'B1', '2028-01-30', 'EXTERNAL', 'ACTIVE', 'AVAILABLE', 'Driver dari vendor PT Trans Logistik Mandiri', 1),
('DRV-005', 'Iwan Gunawan', '0812-3456-7005', '1234-5678-000105', 'A Umum', '2027-11-11', 'INTERNAL', 'ACTIVE', 'ON_LEAVE', 'Cuti tahunan', 1),
('DRV-006', 'Rahmat Hidayat', '0812-3456-7006', '1234-5678-000106', 'B1 Umum', '2025-09-01', 'INTERNAL', 'INACTIVE', 'AVAILABLE', 'SIM kedaluwarsa, non-aktif', 1);

-- 8. Vehicles
INSERT IGNORE INTO vehicles (vehicle_code, plate_number, vehicle_type_id, ownership_type, vendor_id, capacity_weight, capacity_volume, status, notes, created_by)
SELECT v.code, v.plate, vt.id, v.ownership, bp.id, v.weight, v.volume, v.status, v.notes, 1
FROM (
  SELECT 'VH-001' AS code, 'B 9101 KXA' AS plate, 'TRK-TRAILER' AS vtype, 'COMPANY_OWNED' AS ownership, NULL AS vendor, 30000 AS weight, 67 AS volume, 'AVAILABLE' AS status, 'Head + chassis 40ft' AS notes UNION ALL
  SELECT 'VH-002', 'B 9102 KXA', 'TRK-TRAILER', 'COMPANY_OWNED', NULL, 30000, 67, 'AVAILABLE', 'Head + chassis 20/40ft' UNION ALL
  SELECT 'VH-003', 'B 9201 UQB', 'TRK-WINGBOX', 'COMPANY_OWNED', NULL, 15000, 45, 'AVAILABLE', NULL UNION ALL
  SELECT 'VH-004', 'B 9305 FCD', 'TRK-CDD', 'COMPANY_OWNED', NULL, 8000, 25, 'MAINTENANCE', 'Servis berkala' UNION ALL
  SELECT 'VH-005', 'B 9410 TCE', 'TRK-CDE', 'COMPANY_OWNED', NULL, 4000, 15, 'AVAILABLE', NULL UNION ALL
  SELECT 'VH-006', 'B 9502 BTL', 'TRK-FUSO', 'VENDOR', 'VEND-001', 12000, 30, 'AVAILABLE', 'Armada vendor PT Trans Logistik Mandiri' UNION ALL
  SELECT 'VH-007', 'B 9603 BSN', 'TRK-CDD', 'RENTAL', 'VEND-004', 8000, 25, 'AVAILABLE', 'Sewa dari Budi Santoso'
) v
JOIN vehicle_types vt ON vt.code = v.vtype
LEFT JOIN business_partners bp ON bp.partner_code = v.vendor;

-- 9. Akun beban logistik (COA) + mapping Cost Type -> Expense Account
INSERT IGNORE INTO accounts (code, name, type, category, parent_id)
SELECT a.code, a.name, 'EXPENSE', 'Operasional', parent.id
FROM (
  SELECT '5610' AS code, 'Beban Trucking & Angkutan' AS name UNION ALL
  SELECT '5620', 'Beban BBM' UNION ALL
  SELECT '5630', 'Beban Tol & Parkir' UNION ALL
  SELECT '5640', 'Beban Bongkar Muat' UNION ALL
  SELECT '5650', 'Beban Uang Jalan Driver' UNION ALL
  SELECT '5660', 'Beban Jasa Vendor Logistik' UNION ALL
  SELECT '5690', 'Beban Operasional Lain-lain'
) a
JOIN accounts parent ON parent.code = '5000';

INSERT IGNORE INTO cost_type_account_mappings (cost_type, account_id, is_active, created_by)
SELECT m.cost_type, a.id, TRUE, 1
FROM (
  SELECT 'TRANSPORT' AS cost_type, '5610' AS code UNION ALL
  SELECT 'FUEL', '5620' UNION ALL
  SELECT 'TOLL', '5630' UNION ALL
  SELECT 'PARKING', '5630' UNION ALL
  SELECT 'LOADING_UNLOADING', '5640' UNION ALL
  SELECT 'DRIVER_ALLOWANCE', '5650' UNION ALL
  SELECT 'VENDOR_COST', '5660' UNION ALL
  SELECT 'OTHER', '5690'
) m
JOIN accounts a ON a.code = m.code;
