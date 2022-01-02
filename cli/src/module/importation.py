import os
from module.server import Server


class Importation:
    def __init__(self, server: Server):
        self.__server = server

    def list(self):
        ok, data = self.__server.http_client.req("GET", "/api/imports")
        if not ok:
            raise Exception(data["message"])
        return [(i["id"], i["fileName"], i["fileImportTime"]) for i in data["result"]]

    def add(self, filepath: str, remove: bool):
        ok, data = self.__server.http_client.req("POST", "/api/imports/import", body={"filepath": filepath, "removeOriginFile": remove})
        if ok:
            return None
        else:
            return data["message"]

    def batch_update(self, tagme: str or None, partition_time: str or None, create_time: str or None, order_time: str or None, analyse_source: bool):
        ok, data = self.__server.http_client.req("POST", "/api/imports/batch-update", body={
            "analyseSource": analyse_source,
            "partitionTime": partition_time,
            "setOrderTimeBy": order_time,
            "setCreateTimeBy": create_time,
            "tagme": tagme.split(",") if tagme is not None else None
        })
        if not ok:
            raise Exception(data["message"])

    def save(self):
        ok, data = self.__server.http_client.req("POST", "/api/imports/save")
        if not ok:
            raise Exception(data["message"])
        return data["total"]
