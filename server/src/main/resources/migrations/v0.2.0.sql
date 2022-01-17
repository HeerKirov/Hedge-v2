
-- source_image: 添加status字段
ALTER TABLE source_db.source_image ADD COLUMN status TINYINT NOT NULL DEFAULT 0;

-- source_image: 初始化status字段的值，根据empty的值推断得到
UPDATE source_db.source_image SET status = IIF(empty, 0, 1) WHERE TRUE;