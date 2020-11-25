-- 第一版本的sqlite数据模型

-- 图片/集合 的混合表
CREATE TABLE illust(
    id							INTEGER PRIMARY KEY,
    type						TINYINT NOT NULL,                   -- 对象类型{0=无父集合的图像, 1=有父集合的图像, 2=集合}
    parent_id				    INTEGER,                            -- [only image]有父集合时，记录父集合的ID
    file_id				        INTEGER NOT NULL,				    -- 链接的文件ID。对集合来说链接的是封面图像的ID冗余

    description			        TEXT NOT NULL DEFAULT '',           -- 简述信息，不存在时记空串
    score						INTEGER DEFAULT NULL,               -- 图像的评分。具体含义由setting定义
    favorite				    BOOLEAN NOT NULL DEFAULT FALSE,     -- [only image]喜爱标记
    tagme                       TINYINT NOT NULL,                   -- 标记为tagme{0b1=标签, 0b10=作者, 0b100=主题, 0b1000=有关系项, 0b10000=其他信息}

    exported_description        TEXT NOT NULL DEFAULT '',           -- [导出]导出的简述信息。聚合时采用
    exported_score			    INTEGER DEFAULT NULL,               -- [导出]导出的评分。聚合时取平均值

    relations                   TEXT DEFAULT NULL,                  -- 裙带关系::json<number[]>

    partition_time	            DATE NOT NULL,                      -- 用于日历分组的时间。集合的值是导出值，取最早项
    order_time			        BIGINT NOT NULL,                    -- 用于排序的时间。集合的值是导出值，取最早时间
    create_time			        TIMESTAMP NOT NULL,                 -- 初次创建的真实时间
    update_time			        TIMESTAMP NOT NULL                  -- 对image的图像或集合的项进行更新的时间
);
CREATE INDEX illust_filter_index ON illust(type, partition_time);   -- 基于image/collection类型，分区信息的索引
CREATE INDEX illust_tagme_index ON illust(type, tagme);             -- 基于类型和tagme的索引
CREATE INDEX illust_file_index ON illust(id, file_id);              -- id和file的索引

-- 画集
CREATE TABLE album(
    id 				INTEGER PRIMARY KEY,
    title 			TEXT NOT NULL DEFAULT '',       -- 画集标题，不存在时记空串
    description 	TEXT NOT NULL DEFAULT '',       -- 画集的简述信息，不存在时记空串
    score 			INTEGER DEFAULT NULL,           -- 画集的评分。评分的具体含义和范围在setting中配置
    favorite		BOOLEAN NOT NULL DEFAULT FALSE, -- 喜爱标记，会用于收藏展示

    subtitles       TEXT DEFAULT NULL,              -- 画集中的子标题分割项::json<{ordinal: number, title: string}[]>

    create_time 	TIMESTAMP NOT NULL,             -- 此画集初次建立的真实时间
    update_time 	TIMESTAMP NOT NULL              -- 对画集进行更新的真实更新时间(指画集内容变更，比如image source变化、图像替换增删)
);
-- 画集与image的M:N关系
CREATE TABLE album_image_relation(
    album_id 	INTEGER NOT NULL,
    image_id 	INTEGER NOT NULL,
    ordinal 	INTEGER NOT NULL    -- 此image在此画集中的排序顺位，从0开始，由系统统一调配，0号视作封面
);
CREATE UNIQUE INDEX album_image__index ON album_image_relation(album_id, image_id);

-- 文件夹
CREATE TABLE folder(
    id 				INTEGER PRIMARY KEY,
    title 			TEXT NOT NULL DEFAULT '',   -- 文件夹标题，不存在时记空串
    query 			TEXT,                       -- 虚拟查询表达式。此项不为NULL时，文件夹为虚拟文件夹

    cached_count  INTEGER NOT NULL,           -- [冗余]文件夹中的图片数量，仅对非虚拟文件夹有效
    create_time 	TIMESTAMP NOT NULL,         -- 此画集初次建立的真实时间
    update_time 	TIMESTAMP NOT NULL          -- 对画集进行更新的真实更新时间(指画集内容变更，比如image source变化、图像替换增删)
);
-- 文件夹与image的M:N关系
CREATE TABLE folder_image_relation(
    folder_id 	INTEGER NOT NULL,
    image_id 	INTEGER NOT NULL,
    ordinal		INTEGER NOT NULL    -- 此image在此文件夹中的排序顺位，从0开始，由系统统一调配，0号视作封面
);
CREATE UNIQUE INDEX folder_image__index ON folder_image_relation(folder_id, image_id);

-- 时间分区
CREATE TABLE partition(
    `date`        DATE NOT NULL PRIMARY KEY , -- 此时间分区的值
    cached_count  INTEGER NOT NULL DEFAULT 0  -- [冗余]属于此时间分区的图片数量
);
CREATE UNIQUE INDEX partition_date__index ON partition(date);

-- 内容描述 标签
CREATE TABLE meta_db.tag(
    id 				INTEGER PRIMARY KEY,
    ordinal 		INTEGER NOT NULL,           -- 排序下标，由系统维护，同一父标签一组从0开始
    parent_id 		INTEGER DEFAULT NULL,       -- 父标签的ID
    name 			VARCHAR(32) NOT NULL,       -- 标签的名称
    other_names 	TEXT NOT NULL DEFAULT '',   -- 标签的别名::string("nameA|nameB|nameC")
    type 			TINYINT NOT NULL,           -- 标签的类型{0=标签, 1=地址段, 2=虚拟地址段}
    is_group 		TINYINT NOT NULL,           -- 开启组的标记{0=非组, 1=组, 2=强制组, 3=序列化组, 4=强制&序列化组}

    description		TEXT NOT NULL,              -- 标签的内容描述
    links           TEXT DEFAULT NULL,          -- 链接到其他标签::json<number[]>，填写tagId列表，在应用此标签的同时导出链接的标签
    examples		TEXT DEFAULT NULL,          -- 标签的样例image列表::json<number[]>，填写id列表，NULL表示无
    exported_score  INTEGER DEFAULT NULL,       -- [导出]根据其关联的image导出的统计分数
    cached_count 	INTEGER NOT NULL DEFAULT 0  -- [冗余]此标签关联的图片数量
);

-- 作者 标签
CREATE TABLE meta_db.author(
    id 				INTEGER PRIMARY KEY,
    name 			TEXT NOT NULL,                  -- 标签的名称
    other_names     TEXT NOT NULL DEFAULT '',       -- 标签的别名::string("nameA|nameB|nameC")
    type 			TINYINT NOT NULL,               -- 此标签的类型{0=未知, 1=画师, 2=工作室, 3=出版物}
    score			INTEGER DEFAULT NULL,           -- 评分
    favorite		BOOLEAN NOT NULL DEFAULT FALSE, -- 喜爱标记，会用于收藏展示
    links			TEXT DEFAULT NULL,              -- 相关链接::json<Link[]>
    description     TEXT NOT NULL,                  -- 标签的内容描述

    exported_score  INTEGER DEFAULT NULL,           -- 根据评分或其关联的image导出的统计分数
    cached_count 	INTEGER NOT NULL DEFAULT 0,     -- [冗余]此标签关联的图片数量
    cached_annotations 	TEXT DEFAULT NULL           -- [冗余]此标签的注解的缓存，用于显示::json<string[]>
);
CREATE INDEX meta_db.author_filter_index ON author(type, favorite);

-- 主题 标签
CREATE TABLE meta_db.topic(
    id 				INTEGER PRIMARY KEY,
    name 			TEXT NOT NULL,                  -- 标签的名称
    other_names     TEXT NOT NULL DEFAULT '',       -- 标签的别名::string("nameA|nameB|nameC")
    parent_id 	    INTEGER DEFAULT NULL,           -- 父标签的ID。IP可以以IP/版权方为父；角色可以以作品为父
    type 			TINYINT NOT NULL,               -- 此标签的类型{1=持有IP的版权方, 2=IP(作品), 3=角色}
    score			INTEGER DEFAULT NULL,           -- 评分
    favorite		BOOLEAN NOT NULL DEFAULT FALSE, -- 喜爱标记，会用于收藏展示
    links			TEXT DEFAULT NULL,              -- 相关链接::json<Link[]>
    description		TEXT NOT NULL,                  -- 标签的内容描述

    exported_score  INTEGER DEFAULT NULL,           -- [导出]根据评分或其关联的image导出的统计分数
    cached_count 	INTEGER NOT NULL DEFAULT 0,     -- [冗余]此标签关联的图片数量
    cached_annotations 	TEXT DEFAULT NULL           -- [冗余]此标签的注解的缓存，用于显示::json<string[]>
);
CREATE INDEX meta_db.topic_filter_index ON topic(type, favorite);

-- tag和illust/album的关联
CREATE TABLE illust_tag_relation(
    tag_id 		INTEGER NOT NULL,
    illust_id 	INTEGER NOT NULL,
    is_exported BOOLEAN NOT NULL    -- 此标签是导出产物。且对于标签来说，还有根据标签规则自动导出的导出产物
);
CREATE TABLE album_tag_relation(
    tag_id 		INTEGER NOT NULL,
    album_id 	INTEGER NOT NULL,
    is_exported BOOLEAN NOT NULL    -- 此标签是导出产物。且对于标签来说，还有根据标签规则自动导出的导出产物
);
CREATE UNIQUE INDEX illust_tag__index ON illust_tag_relation(tag_id, illust_id);
CREATE UNIQUE INDEX album_tag__index ON album_tag_relation(tag_id, album_id);

-- author和illust/album的关联
CREATE TABLE illust_author_relation(
    author_id   INTEGER NOT NULL,
    illust_id   INTEGER NOT NULL,
    is_exported BOOLEAN NOT NULL    -- 此标签是导出产物
);
CREATE TABLE album_author_relation(
    author_id 	INTEGER NOT NULL,
    album_id 	INTEGER NOT NULL,
    is_exported BOOLEAN NOT NULL    -- 此标签是导出产物
);
CREATE UNIQUE INDEX illust_author__index ON illust_author_relation(author_id, illust_id);
CREATE UNIQUE INDEX album_author__index ON album_author_relation(author_id, album_id);

-- topic和illust/album的关联
CREATE TABLE illust_topic_relation(
    topic_id    INTEGER NOT NULL,
    illust_id   INTEGER NOT NULL,
    is_exported BOOLEAN NOT NULL    -- 此标签是导出产物
);
CREATE TABLE album_topic_relation(
    topic_id 	INTEGER NOT NULL,
    album_id 	INTEGER NOT NULL,
    is_exported BOOLEAN NOT NULL    -- 此标签是导出产物
);
CREATE UNIQUE INDEX illust_topic__index ON illust_topic_relation(topic_id, illust_id);
CREATE UNIQUE INDEX album_topic__index ON album_topic_relation(topic_id, album_id);

-- 注解
CREATE TABLE meta_db.annotation(
    id                  INTEGER PRIMARY KEY,
    name                TEXT NOT NULL,        -- 注解名称
    can_be_exported     BOOLEAN NOT NULL,     -- 是否为导出注解
    target              TEXT DEFAULT NULL     -- 注解的适用范围，null表示无限制::json<string[]>
);
CREATE TABLE meta_db.tag_annotation_relation(
    annotation_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL
);
CREATE TABLE meta_db.author_annotation_relation(
    annotation_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL
);
CREATE TABLE meta_db.topic_annotation_relation(
    annotation_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL
);
CREATE TABLE illust_annotation_relation(
    annotation_id INTEGER NOT NULL,
    illust_id INTEGER NOT NULL,
    exported_from TINYINT NOT NULL  -- 通过哪种标签导入进来的{0b1=标签, 0b10=作者, 0b100=主题}
);
CREATE TABLE album_annotation_relation(
    annotation_id INTEGER NOT NULL,
    album_id INTEGER NOT NULL,
    exported_from TINYINT NOT NULL  -- 通过哪种标签导入进来的{0b1=标签, 0b10=作者, 0b100=主题}
);
CREATE UNIQUE INDEX meta_db.tag_annotation__index ON tag_annotation_relation(annotation_id, tag_id);
CREATE UNIQUE INDEX meta_db.topic_annotation__index ON topic_annotation_relation(annotation_id, topic_id);
CREATE UNIQUE INDEX meta_db.copyright_annotation__index ON author_annotation_relation(annotation_id, author_id);
CREATE UNIQUE INDEX illust_annotation__index ON illust_annotation_relation(annotation_id, exported_from, illust_id);
CREATE UNIQUE INDEX album_annotation__index ON album_annotation_relation(annotation_id, exported_from, album_id);

-- 导入表
CREATE TABLE import_image(
    id                  INTEGER PRIMARY KEY,
    file_id             INTEGER NOT NULL,               -- 链接的文件id

    file_name           TEXT,                           -- 原文件名，包括扩展名，不包括文件路径。从web导入时可能没有，此时填null
    file_path           TEXT,                           -- 原文件路径，不包括文件名。从web导入时可能没有，此时填null
    file_create_time    TIMESTAMP,                      -- 原文件创建时间。从web导入时可能没有，此时填null
    file_update_time    TIMESTAMP,                      -- 原文件修改时间。从web导入时可能没有，此时填null
    file_import_time    TIMESTAMP NOT NULL,             -- 一阶导入此文件的时间
    file_from_source    TEXT,                           -- 原文件的来源信息::json<string[]>。对于macOS，从metadata用xattr取得

    tagme               TINYINT NOT NULL,               -- 标记为tagme，详见illust部分。可以通过配置决定要不要给项目加初始tagme，以及该加哪些
    source              VARCHAR(16) DEFAULT NULL,       -- 来源网站的代号，没有填null
    source_id           BIGINT DEFAULT NULL,            -- 来源网站中的图像代号，没有填null
    source_part         INTEGER DEFAULT NULL,           -- 来源网站中的二级图像代号，没有填null
    partition_time	    DATE NOT NULL,                  -- 用于日历分组的时间
    order_time			BIGINT NOT NULL,                -- 用于排序的时间
    create_time			TIMESTAMP NOT NULL,             -- 初次创建的时间

    actions             TEXT DEFAULT NULL               -- 对此记录，执行二阶导入时要采取的操作序列::json<ImportAction[]>
);

-- 来源信息
CREATE TABLE source_db.source_image(
    image_id 		INTEGER PRIMARY KEY,                -- 关联的image
    source 			VARCHAR(16) NOT NULL DEFAULT '',    -- 来源网站的代号。没有填''
    source_id 		BIGINT NOT NULL DEFAULT -1,         -- 来源网站中的图像代号。没有填-1
    source_part 	INTEGER NOT NULL DEFAULT -1,        -- 来源网站中的二级图像代号，有些会有，比如pixiv。没有填-1

    title 			TEXT DEFAULT NULL,                  -- 原数据的标题信息，有些会有，比如pixiv
    description     TEXT DEFAULT NULL,                  -- 原数据的描述信息，有些会有，比如pixiv
    tags 			TEXT DEFAULT NULL,                  -- 原数据的标签信息::json<SourceTag[]>
    relations 		TEXT DEFAULT NULL,                  -- 原数据的关系信息::json<SourceRelations>

    analyse_status  TINYINT NOT NULL DEFAULT 0,         -- 原数据的解析状态{0=无,1=已解析, 2=解析出错, 3=手动填写, 4=未找到信息}
    analyse_time    TIMESTAMP DEFAULT NULL              -- 对原数据进行解析的时间
);
CREATE INDEX source_db.source_image__source__index ON source_image(source, source_id, source_part);

-- 原始标签映射
CREATE TABLE source_db.source_tag_mapping(
    id INTEGER PRIMARY KEY,
    source VARCHAR(16),                 -- 来源网站的代号，可以为空表示对任意来源适用
    source_tag_type TEXT,               -- 源tag的类型，可以为空表示不区分类型
    source_tag TEXT NOT NULL,           -- 源tag名称
    save_tag_type VARCHAR(10) NOT NULL, -- 转换为什么类型的tag{tag, author, topic}
    save_tag_id INTEGER NOT NULL        -- 目标tag的tag id
);

-- 物理文件
CREATE TABLE origin_db.file(
    id 				INTEGER PRIMARY KEY,            -- 自增ID
    folder 			VARCHAR(16) NOT NULL,           -- 所在文件夹名称::format<yyyy-MM-dd>，一般用其添加日期作为文件夹名称
    extension		VARCHAR(8) NOT NULL,            -- 文件扩展名，同时也表示此文件的类型
    thumbnail	    BOOLEAN NOT NULL,               -- 是否存在缩略图

    size            BIGINT NOT NULL,                -- 此文件占用的磁盘大小，单位Byte
    thumbnail_size  BIGINT NOT NULL,                -- 缩略图占用的磁盘大小，单位Byte。没有缩略图时记0

    deleted		    BOOLEAN NOT NULL DEFAULT FALSE, -- 文件是否处于删除状态。由于同步机制的需要，文件可以删除，记录不能删除
    sync_records,   TEXT NOT NULL,                  -- 该文件对象的同步记录::json<SyncRecord[]>
    create_time 	TIMESTAMP NOT NULL,             -- 创建时间
    update_time     TIMESTAMP NOT NULL              -- 上次更新的时间
);