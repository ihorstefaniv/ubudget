-- Fix: owner can always see their own company (not just via erp_is_member)
-- Needed because after INSERT the trigger hasn't committed yet when chained SELECT runs

DROP POLICY IF EXISTS "companies_select" ON erp_companies;

CREATE POLICY "companies_select" ON erp_companies FOR SELECT
  USING (owner_id = auth.uid() OR erp_is_member(id));
