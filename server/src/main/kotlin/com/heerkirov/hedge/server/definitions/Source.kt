package com.heerkirov.hedge.server.definitions

/**
 * 当前受到系统支持的source网站列表。受到支持指该网站：
 * - 有LOGO登记。
 * - 支持此网站的图片的文件信息->source id的解析。
 * - (可能)支持此网站的source id->source data的爬取。
 */
val supportedSourceSite = listOf("pixiv", "complex", "konachan", "nijie")