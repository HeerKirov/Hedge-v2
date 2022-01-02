import yaml
from schema import Schema, Optional, And, Or
from module.server import Server


class Applier:
    def __init__(self, server: Server):
        self.__server = server
        self.__doc = []
        self.__applied_setting = {}
        self.__applied_source = []
        self.__applied_annotations = []
        self.__applied_authors = []
        self.__applied_topics = []
        self.__applied_tags = []
        self.__submit_errors = []
        self.__created = {}
        self.__updated = {}

    def apply(self, doc: str):
        for doc in [i for i in yaml.safe_load_all(doc)]:
            if not isinstance(doc, dict):
                raise Exception("Yaml document must be a dict{}.")
            doc_kind = doc.get('kind', None)
            doc_version = doc.get('version', 'v1')
            doc_content = doc.get('spec', None)
            if doc_kind is None:
                raise Exception("Yaml document must have field 'kind'.")
            if doc_content is None:
                raise Exception("Yaml document must have field 'spec'.")

            if doc_kind == 'setting':
                self.__apply_setting(doc_content, doc_version)
            elif doc_kind == 'source':
                self.__apply_source(doc_content, doc_version)
            elif doc_kind == 'annotation':
                self.__apply_annotation(doc_content, doc_version)
            elif doc_kind == 'topic':
                self.__apply_topic(doc_content, doc_version)
            elif doc_kind == 'author':
                self.__apply_author(doc_content, doc_version)
            elif doc_kind == 'tag':
                self.__apply_tag(doc_content, doc_version)
            else:
                raise Exception("Document kind '%s' is invalid." % (doc_kind,))

    def submit(self):
        if len(self.__applied_setting) > 0:
            self.__submit_setting()
        self.__submit_source()
        self.__submit_annotation()
        self.__submit_author()
        self.__submit_topic()
        self.__submit_tag()

    @property
    def submit_errors(self):
        return self.__submit_errors

    @property
    def created(self):
        return self.__created

    @property
    def updated(self):
        return self.__updated

    def __apply_setting(self, doc, ver):
        setting_schema.validate(doc)
        for (k, v) in doc.items():
            if k not in self.__applied_setting:
                self.__applied_setting[k] = v
            else:
                for (s_k, s_v) in v.items():
                    self.__applied_setting[k][s_k] = v

    def __apply_source(self, doc, ver):
        source_schema.validate(doc)
        self.__applied_source += doc

    def __apply_annotation(self, doc, ver):
        annotation_schema.validate(doc)
        self.__applied_annotations += doc

    def __apply_topic(self, doc, ver):
        topic_schema.validate(doc)
        self.__applied_topics += doc

    def __apply_author(self, doc, ver):
        author_schema.validate(doc)
        self.__applied_authors += doc

    def __apply_tag(self, doc, ver):
        tag_schema.validate(doc)
        self.__applied_tags += doc

    def __submit_setting(self):
        if 'meta' in self.__applied_setting:
            ok, data = self.__server.http_client.req('PATCH', '/api/setting/meta', body=self.__applied_setting['meta'])
            if not ok:
                self.__submit_errors.append(('setting', None, data['message']))
            else:
                self.__set_count_statistic('setting', updated=True, count=len(self.__applied_setting['meta']))
        if 'import' in self.__applied_setting:
            ok, data = self.__server.http_client.req('PATCH', '/api/setting/import', body=self.__applied_setting['import'])
            if not ok:
                self.__submit_errors.append(('setting', None, data['message']))
            else:
                self.__set_count_statistic('setting', updated=True, count=len(self.__applied_setting['import']))
        if 'query' in self.__applied_setting:
            ok, data = self.__server.http_client.req('PATCH', '/api/setting/query', body=self.__applied_setting['query'])
            if not ok:
                self.__submit_errors.append(('setting', None, data['message']))
            else:
                self.__set_count_statistic('setting', updated=True, count=len(self.__applied_setting['query']))
        if 'source' in self.__applied_setting and 'sites' in self.__applied_setting['source']:
            sites = self.__applied_setting['source']['sites']
            for site in sites:
                ok, data = self.__server.http_client.req('POST', '/api/setting/source/sites', body=site)
                if not ok:
                    if data['code'] == 'ALREADY_EXISTS':
                        ok, data = self.__server.http_client.req('PUT', '/api/setting/source/sites/%s' % (site['name']), body=site)
                        if not ok:
                            self.__submit_errors.append(('setting', site['name'], data['message']))
                        else:
                            self.__set_count_statistic('setting', updated=True, count=1)
                    else:
                        self.__submit_errors.append(('setting', site['name'], data['message']))
                else:
                    self.__set_count_statistic('setting', updated=False, count=1)

    def __submit_source(self):
        for source in self.__applied_source:
            self.__submit_rest_object(source, '/api/source-images', 'source', '%s/%s' % (source['source'], source['sourceId']))

    def __submit_annotation(self):
        for annotation in self.__applied_annotations:
            self.__submit_rest_object(annotation, '/api/annotations', 'annotation', annotation['name'], detail_id=lambda a: {'name': annotation['name']})

    def __submit_author(self):
        for author in self.__applied_authors:
            self.__submit_rest_object(author, '/api/authors', 'author', author['name'],
                                      detail_id=lambda a: {'query': "`%s`" % (author['name'],)})

    def __submit_topic(self):
        def recursive(items, parent_id=None):
            for topic in items:
                body = {}
                for k, v in topic.items():
                    if k != 'children':
                        body[k] = v
                if parent_id is not None:
                    body['parentId'] = parent_id
                this_id = self.__submit_rest_object(body, '/api/topics', 'topic', topic['name'],
                                                    detail_id=lambda a: {'query': "`%s`" % (topic['name'],), 'parentId': parent_id})
                if 'children' in topic:
                    recursive(topic['children'], this_id)

        recursive(self.__applied_topics)

    def __submit_tag(self):
        def recursive(items, parent_id=None):
            for tag in items:
                body = {}
                for k, v in tag.items():
                    if k == 'group':
                        if isinstance(v, bool):
                            body[k] = 'YES' if v else 'NO'
                        elif isinstance(v, dict):
                            body[k] = 'FORCE_AND_SEQUENCE' if v['force'] and v['sequence'] else 'SEQUENCE' if v['sequence'] else 'FORCE' if v['force'] else 'YES'
                    elif k != 'children':
                        body[k] = v
                body['parentId'] = parent_id
                this_id = self.__submit_rest_object(body, '/api/tags', 'tag', tag['name'], detail_id=lambda a: {'search': tag['name'], 'parent': parent_id})
                if 'children' in tag:
                    recursive(tag['children'], this_id)
        recursive(self.__applied_tags)

    def __submit_rest_object(self, item, api_path, kind, item_key, detail_id=None):
        ok, data = self.__server.http_client.req('POST', api_path, body=item)
        if not ok:
            if data['code'] == 'ALREADY_EXISTS':
                if callable(detail_id):
                    ok, data = self.__server.http_client.req('GET', api_path, query=detail_id(item))
                    if not ok:
                        self.__submit_errors.append((kind, item_key, data['message']))
                        return None
                    result = data['result']
                    if len(result) > 0:
                        detail_id = result[0]['id']
                    else:
                        self.__submit_errors.append((kind, item_key, 'Cannot find query result.'))
                        return None
                elif detail_id is None:
                    detail_id = item_key

                ok, data = self.__server.http_client.req('PATCH', '%s/%s' % (api_path, detail_id), body=item)
                if not ok:
                    self.__submit_errors.append((kind, item_key, data['message']))
                    return None
                else:
                    self.__set_count_statistic(kind, updated=True, count=1)
                    return detail_id
            else:
                self.__submit_errors.append((kind, item_key, data['message']))
                return None
        else:
            self.__set_count_statistic(kind, updated=False, count=1)
            return data['id'] if data is not None else None

    def __set_count_statistic(self, key, updated, count):
        if updated:
            if key in self.__updated:
                self.__updated[key] = self.__updated[key] + count
            else:
                self.__updated[key] = count
        else:
            if key in self.__created:
                self.__created[key] = self.__created[key] + count
            else:
                self.__created[key] = count


setting_schema = Schema({
    Optional('meta'): {
        Optional('scoreDescriptions'): [{
            'word': str,
            'content': str
        }],
        Optional('autoCleanTagme'): bool,
        Optional('topicColors'): {
            Optional('UNKNOWN'): str,
            Optional('COPYRIGHT'): str,
            Optional('WORK'): str,
            Optional('CHARACTER'): str,
        },
        Optional('authorColors'): {
            Optional('UNKNOWN'): str,
            Optional('ARTIST'): str,
            Optional('STUDIO'): str,
            Optional('PUBLISH'): str,
        },
    },
    Optional('import'): {
        Optional('autoAnalyseMeta'): bool,
        Optional('setTagmeOfTag'): bool,
        Optional('setTagmeOfSource'): bool,
        Optional('setTimeBy'): And(str, lambda s: s in ('UPDATE_TIME', 'CREATE_TIME', 'IMPORT_TIME')),
        Optional('setPartitionTimeDelay'): int,
        Optional('sourceAnalyseRules'): [{
            'type': And(str, lambda s: s in ('name', 'from-meta')),
            'site': And(str, lambda s: len(s) > 0),
            'regex': And(str, lambda s: len(s) > 0),
            'idIndex': And(int, lambda i: i >= 0),
            Optional('secondaryIdIndex'): And(int, lambda i: i >= 0)
        }],
    },
    Optional('query'): {
        Optional('chineseSymbolReflect'): bool,
        Optional('translateUnderscoreToSpace'): bool,
        Optional('queryLimitOfQueryItems'): int,
        Optional('warningLimitOfUnionItems'): int,
        Optional('warningLimitOfIntersectItems'): int
    },
    Optional('source'): {
        Optional('sites'): [{
            'name': And(str, lambda s: len(s) > 0),
            Optional('title'): And(str, lambda s: len(s) > 0),
            Optional('hasSecondaryId'): bool
        }]
    }
})

source_schema = Schema([{
    'source': And(str, lambda s: len(s) > 0),
    'sourceId': int,
    Optional('title'): Or(str, None),
    Optional('description'): Or(str, None),
    Optional('tags'): [{
        'name': And(str, lambda s: len(s) > 0),
        Optional('displayName'): Or(None, And(str, lambda s: len(s) > 0)),
        Optional('type'): Or(None, And(str, lambda s: len(s) > 0)),
    }],
    Optional('pools'): [str],
    Optional('relations'): [int]
}])

annotation_schema = Schema([{
    'name': And(str, lambda s: len(s) > 0),
    'canBeExported': bool,
    Optional('target'): [And(str, lambda s: s in ('TAG', 'ARTIST', 'STUDIO', 'PUBLISH', 'COPYRIGHT', 'WORK', 'CHARACTER', 'AUTHOR', 'TOPIC'))]
}])

author_schema = Schema([{
    'name': And(str, lambda s: len(s) > 0),
    Optional('otherNames'): [And(str, lambda s: len(s) > 0)],
    Optional('type'): And(str, lambda s: s in ('UNKNOWN', 'ARTIST', 'STUDIO', 'PUBLISH')),
    Optional('description'): str,
    Optional('keywords'): [str],
    Optional('links'): [{'title': str, 'link': str}],
    Optional('favorite'): bool,
    Optional('score'): And(int, lambda s: 1 <= s <= 10),
    Optional('annotations'): [Or(str, int)],
    Optional('mappingSourceTags'): [{
        'source': str,
        'name': And(str, lambda s: len(s) > 0),
        Optional('displayName'): And(str, lambda s: len(s) > 0),
        Optional('type'): And(str, lambda s: len(s) > 0),
    }]
}])

topic_schema = Schema([{
    'name': And(str, lambda s: len(s) > 0),
    Optional('otherNames'): [And(str, lambda s: len(s) > 0)],
    Optional('type'): And(str, lambda s: s in ('UNKNOWN', 'COPYRIGHT', 'WORK', 'CHARACTER')),
    Optional('description'): str,
    Optional('keywords'): [str],
    Optional('links'): [{'title': str, 'link': str}],
    Optional('favorite'): bool,
    Optional('score'): And(int, lambda s: 1 <= s <= 10),
    Optional('annotations'): [Or(str, int)],
    Optional('mappingSourceTags'): [{
        'source': str,
        'name': And(str, lambda s: len(s) > 0),
        Optional('displayName'): And(str, lambda s: len(s) > 0),
        Optional('type'): And(str, lambda s: len(s) > 0),
    }],
    Optional('children'): lambda child: topic_schema.validate(child)
}])

tag_schema = Schema([{
    'name': And(str, lambda s: len(s) > 0),
    'type': And(str, lambda s: s in ('TAG', 'ADDR', 'VIRTUAL_ADDR')),
    Optional('otherNames'): [And(str, lambda s: len(s) > 0)],
    Optional('group'): Or(bool, {
        Optional('force'): bool,
        Optional('sequence'): bool,
    }),
    Optional('links'): [Or(int, [str], str)],
    Optional('annotations'): [Or(str, int)],
    Optional('description'): str,
    Optional('color'): str,
    Optional('examples'): [int],
    Optional('children'): lambda child: tag_schema.validate(child)
}])
