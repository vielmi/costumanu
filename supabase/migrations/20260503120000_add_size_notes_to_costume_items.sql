alter table costume_items
  add column if not exists size_notes text default null;
