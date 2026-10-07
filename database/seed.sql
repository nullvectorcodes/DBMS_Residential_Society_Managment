-- ==========================================================
-- RESIDENTIAL SOCIETY MANAGEMENT SYSTEM (SEED DATA)
-- 20+ Detailed Mock Entries for DBMS Demonstration
-- ==========================================================

USE `residential_society_db`;

-- Insert Wings / Towers
INSERT INTO `wings` (`wing_id`, `wing_name`, `total_floors`) VALUES
(1, 'Wing A', 5),
(2, 'Wing B', 5),
(3, 'Wing C', 5);

-- Insert 20 Flats
INSERT INTO `flats` (`flat_id`, `wing_id`, `flat_number`, `floor_number`, `flat_type`, `area_sqft`, `occupancy_status`) VALUES
(1, 1, 'A-101', 1, '2BHK', 1150, 'OCCUPIED'),
(2, 1, 'A-102', 1, '2BHK', 1150, 'OCCUPIED'),
(3, 1, 'A-201', 2, '3BHK', 1550, 'OCCUPIED'),
(4, 1, 'A-202', 2, '3BHK', 1600, 'OCCUPIED'),
(5, 1, 'A-301', 3, '2BHK', 1150, 'OCCUPIED'),
(6, 1, 'A-302', 3, '3BHK', 1550, 'OCCUPIED'),
(7, 1, 'A-401', 4, '4BHK', 2200, 'OCCUPIED'),
(8, 2, 'B-101', 1, '1BHK', 750, 'OCCUPIED'),
(9, 2, 'B-102', 1, '2BHK', 1180, 'OCCUPIED'),
(10, 2, 'B-201', 2, '2BHK', 1200, 'OCCUPIED'),
(11, 2, 'B-202', 2, '3BHK', 1620, 'OCCUPIED'),
(12, 2, 'B-301', 3, '3BHK', 1580, 'OCCUPIED'),
(13, 2, 'B-302', 3, '2BHK', 1200, 'OCCUPIED'),
(14, 2, 'B-401', 4, 'Penthouse', 2850, 'OCCUPIED'),
(15, 3, 'C-101', 1, '1BHK', 760, 'OCCUPIED'),
(16, 3, 'C-102', 1, '2BHK', 1190, 'OCCUPIED'),
(17, 3, 'C-201', 2, '2BHK', 1210, 'OCCUPIED'),
(18, 3, 'C-202', 2, '3BHK', 1650, 'OCCUPIED'),
(19, 3, 'C-301', 3, '3BHK', 1600, 'OCCUPIED'),
(20, 3, 'C-401', 4, 'Penthouse', 2900, 'OCCUPIED');

-- Insert 20 Residents living in the 20 Flats
INSERT INTO `residents` (`resident_id`, `flat_id`, `first_name`, `last_name`, `phone`, `email`, `resident_type`, `move_in_date`, `emergency_contact`) VALUES
(1, 1, 'Aarav', 'Sharma', '+91 98201 11223', 'aarav.sharma@example.com', 'OWNER', '2021-04-15', '+91 98201 99887'),
(2, 2, 'Priya', 'Nair', '+91 98450 22334', 'priya.nair@example.com', 'TENANT', '2023-08-01', '+91 98450 77665'),
(3, 3, 'Rohan', 'Mehta', '+91 97110 33445', 'rohan.mehta@example.com', 'OWNER', '2020-01-10', '+91 97110 55443'),
(4, 4, 'Ananya', 'Deshmukh', '+91 99230 44556', 'ananya.d@example.com', 'OWNER', '2021-11-20', '+91 99230 33221'),
(5, 5, 'Vikram', 'Malhotra', '+91 98190 55667', 'vikram.m@example.com', 'TENANT', '2024-02-01', '+91 98190 44332'),
(6, 6, 'Kavita', 'Singhania', '+91 98765 66778', 'kavita.s@example.com', 'OWNER', '2019-06-12', '+91 98765 11223'),
(7, 7, 'Siddharth', 'Verma', '+91 98920 77889', 'siddharth.v@example.com', 'OWNER', '2020-09-05', '+91 98920 66554'),
(8, 8, 'Neha', 'Patel', '+91 98210 88990', 'neha.patel@example.com', 'TENANT', '2023-12-15', '+91 98210 22110'),
(9, 9, 'Aditya', 'Rao', '+91 98670 99001', 'aditya.rao@example.com', 'OWNER', '2022-03-18', '+91 98670 55441'),
(10, 10, 'Sneha', 'Kulkarni', '+91 99300 10112', 'sneha.k@example.com', 'OWNER', '2021-07-25', '+91 99300 44331'),
(11, 11, 'Rajesh', 'Bhatia', '+91 98111 21223', 'rajesh.bhatia@example.com', 'OWNER', '2018-10-10', '+91 98111 77889'),
(12, 12, 'Pooja', 'Iyer', '+91 98401 32334', 'pooja.iyer@example.com', 'TENANT', '2024-05-10', '+91 98401 66552'),
(13, 13, 'Sameer', 'Chopra', '+91 98102 43445', 'sameer.chopra@example.com', 'OWNER', '2021-02-14', '+91 98102 99881'),
(14, 14, 'Zoya', 'Merchant', '+91 99203 54556', 'zoya.m@example.com', 'OWNER', '2019-12-01', '+91 99203 11229'),
(15, 15, 'Amit', 'Joshi', '+91 98711 65667', 'amit.joshi@example.com', 'TENANT', '2023-04-01', '+91 98711 88776'),
(16, 16, 'Deepika', 'Menon', '+91 98452 76778', 'deepika.menon@example.com', 'OWNER', '2020-05-30', '+91 98452 33441'),
(17, 17, 'Harsh', 'Vardhan', '+91 98290 87889', 'harsh.v@example.com', 'OWNER', '2022-09-12', '+91 98290 55663'),
(18, 18, 'Sunita', 'Gupta', '+91 98188 98990', 'sunita.g@example.com', 'TENANT', '2024-01-15', '+91 98188 11224'),
(19, 19, 'Karan', 'Kapoor', '+91 99870 09101', 'karan.kapoor@example.com', 'OWNER', '2020-07-22', '+91 99870 66775'),
(20, 20, 'Meera', 'Sen', '+91 98300 19212', 'meera.sen@example.com', 'OWNER', '2019-03-11', '+91 98300 88992');

-- Insert 20 Maintenance Bills (October 2026 Cycle)
-- Showing exact distribution of PAID, PENDING, and OVERDUE
INSERT INTO `maintenance_bills` (`bill_id`, `flat_id`, `resident_id`, `billing_month`, `amount`, `due_date`, `status`, `payment_date`, `payment_method`, `transaction_ref`, `notes`) VALUES
(1, 1, 1, '2026-10', 4200.00, '2026-10-15', 'PAID', '2026-10-02', 'UPI', 'UPI-99281048291', 'Paid via Google Pay'),
(2, 2, 2, '2026-10', 4200.00, '2026-10-15', 'PAID', '2026-10-04', 'NET_BANKING', 'HDFC-TXN-772819', 'HDFC NetBanking transferred'),
(3, 3, 3, '2026-10', 5500.00, '2026-10-15', 'PENDING', NULL, NULL, NULL, 'Payment reminder sent'),
(4, 4, 4, '2026-10', 5500.00, '2026-10-15', 'PAID', '2026-10-05', 'CREDIT_CARD', 'CC-AUTH-882910', 'ICICI Credit Card auto-pay'),
(5, 5, 5, '2026-10', 4200.00, '2026-10-15', 'OVERDUE', NULL, NULL, NULL, 'Grace period expired, fine applicable'),
(6, 6, 6, '2026-10', 5500.00, '2026-10-15', 'PAID', '2026-10-01', 'UPI', 'UPI-88192019283', 'Paid via PhonePe'),
(7, 7, 7, '2026-10', 7000.00, '2026-10-15', 'PAID', '2026-10-03', 'NET_BANKING', 'SBI-NEFT-991823', 'SBI NEFT direct bank transfer'),
(8, 8, 8, '2026-10', 3200.00, '2026-10-15', 'PENDING', NULL, NULL, NULL, 'Awaiting tenant confirmation'),
(9, 9, 9, '2026-10', 4200.00, '2026-10-15', 'PAID', '2026-10-02', 'UPI', 'UPI-11827364521', 'Paid via Paytm'),
(10, 10, 10, '2026-10', 4200.00, '2026-10-15', 'PAID', '2026-10-06', 'CASH', 'REC-CASH-0042', 'Cash receipt handed at society office'),
(11, 11, 11, '2026-10', 5500.00, '2026-10-15', 'PAID', '2026-10-01', 'NET_BANKING', 'AXIS-IMPS-662819', 'Axis Bank IMPS transfer'),
(12, 12, 12, '2026-10', 5500.00, '2026-10-15', 'OVERDUE', NULL, NULL, NULL, 'Second notice issued'),
(13, 13, 13, '2026-10', 4200.00, '2026-10-15', 'PAID', '2026-10-03', 'CREDIT_CARD', 'CC-AUTH-339102', 'Axis Magnus Credit Card'),
(14, 14, 14, '2026-10', 8500.00, '2026-10-15', 'PAID', '2026-10-04', 'NET_BANKING', 'KOTAK-RTGS-55412', 'Penthouse luxury maintenance slab'),
(15, 15, 15, '2026-10', 3200.00, '2026-10-15', 'PENDING', NULL, NULL, NULL, 'Will settle by 12th Oct'),
(16, 16, 16, '2026-10', 4200.00, '2026-10-15', 'PAID', '2026-10-05', 'UPI', 'UPI-66778899001', 'Paid via BHIM UPI'),
(17, 17, 17, '2026-10', 4200.00, '2026-10-15', 'PAID', '2026-10-02', 'CREDIT_CARD', 'CC-AUTH-771923', 'Standard Chartered Card'),
(18, 18, 18, '2026-10', 5500.00, '2026-10-15', 'OVERDUE', NULL, NULL, NULL, 'Follow-up with owner initiated'),
(19, 19, 19, '2026-10', 5500.00, '2026-10-15', 'PAID', '2026-10-06', 'UPI', 'UPI-55443322119', 'Paid via Cred UPI'),
(20, 20, 20, '2026-10', 8500.00, '2026-10-15', 'PENDING', NULL, NULL, NULL, 'Owner traveling overseas, promised wire');

-- Insert 5 Sample Complaints for Residential Support
INSERT INTO `complaints` (`complaint_id`, `flat_id`, `resident_id`, `category`, `title`, `description`, `status`) VALUES
(1, 3, 3, 'PLUMBING', 'Main balcony drain clog', 'Water backflow during heavy morning rain', 'IN_PROGRESS'),
(2, 5, 5, 'LIFT', 'Tower A elevator jerky stop', 'Lift stops with a jolt on 3rd floor', 'OPEN'),
(3, 8, 8, 'PARKING', 'Unauthorized vehicle in B-101 slot', 'White sedan parked in reserved resident slot', 'RESOLVED'),
(4, 12, 12, 'ELECTRICAL', 'Corridor light flickering outside B-301', 'Tube light in common hallway needs replacement', 'RESOLVED'),
(5, 18, 18, 'SECURITY', 'Intercom buzzer not ringing', 'Guard cannot reach flat through lobby intercom', 'OPEN');
