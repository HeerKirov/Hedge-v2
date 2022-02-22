
-- source_image: 添加status字段
ALTER TABLE source_db.source_image ADD COLUMN status TINYINT NOT NULL DEFAULT 0;

-- source_image: 初始化status字段的值，根据empty的值推断得到
UPDATE source_db.source_image SET status = IIF(empty, 0, 1) WHERE TRUE;

-- source_pool & relation
CREATE TABLE source_db.source_pool(
    id              INTEGER PRIMARY KEY,            -- id
    source          VARCHAR(16) NOT NULL,           -- 来源网站的代号
    key             TEXT NOT NULL,                  -- pool的唯一区分键，一般指pool id
    title           TEXT NOT NULL                   -- pool标题
);

-- 来源信息与标签的关联
CREATE TABLE source_db.source_pool_relation(
    source_id       INTEGER NOT NULL,               -- source image id
    pool_id         INTEGER NOT NULL                -- source pool id
);
CREATE UNIQUE INDEX source_db.source_pool__index ON source_pool_relation(source_id, pool_id);

-- find similar: 相关功能表
CREATE TABLE system_db.find_similar_task(
    id              INTEGER PRIMARY KEY,
    selector        TEXT NOT NULL,
    config          TEXT,
    record_time     TIMESTAMP NOT NULL
);

CREATE TABLE system_db.find_similar_result(
    id              INTEGER PRIMARY KEY,
    key             TEXT NOT NULL,
    type            TINYINT NOT NULL,
    image_ids       TEXT NOT NULL,
    ordered         INTEGER NOT NULL,
    record_time     TIMESTAMP NOT NULL
);
