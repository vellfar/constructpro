-- Add Store Manager role
INSERT INTO "Role" (name, description, "createdAt", "updatedAt")
VALUES ('Store Manager', 'Manages fuel and equipment inventory', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Add permissions for Store Manager
INSERT INTO "Permission" (name, description, "createdAt", "updatedAt")
VALUES 
  ('manage_fuel_issuance', 'Can issue fuel to equipment', NOW(), NOW()),
  ('view_inventory', 'Can view inventory levels', NOW(), NOW()),
  ('manage_equipment_assignments', 'Can assign equipment to projects', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Link permissions to Store Manager role
INSERT INTO "_PermissionToRole" ("A", "B")
SELECT p.id, r.id
FROM "Permission" p, "Role" r
WHERE p.name IN ('manage_fuel_issuance', 'view_inventory', 'manage_equipment_assignments')
  AND r.name = 'Store Manager'
ON CONFLICT DO NOTHING;
