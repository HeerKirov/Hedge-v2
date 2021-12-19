import os.path
import json
import subprocess
import time

import requests
from module.channel import ChannelManager
from module.local_config import LocalConfig


class Server:
    def __init__(self, local_config: LocalConfig, channel: ChannelManager):
        self.__server_path = local_config.server_path
        self.__appdata_path = local_config.appdata_path
        self.__frontend_path = local_config.frontend_path
        self.__channel = channel
        self.__http_client = ServerHttpClient()

    def status(self):
        """
        查看当前server的运行状态。综合进程状态和init状态来判断。
        :return: {
            status: "STOP"|"STARTING"|"LOADING"|"RUNNING"
            pid?: number
            port?: number
            start_time?: number
        }
        """
        pid_file = self.__read_pid_path()
        if pid_file is None:
            return {"status": "STOP"}
        elif pid_file.get("port", None) is None or pid_file.get("token", None) is None:
            return {"status": "STARTING", "pid": pid_file["pid"], "port": pid_file["port"], "start_time": pid_file["startTime"]}
        self.__http_client.set_access(pid_file["port"], pid_file["token"])

        try:
            ok, data = self.__http_client.req("GET", "/app/health")
        except requests.RequestException:
            return {"status": "STARTING", "pid": pid_file["pid"], "port": pid_file["port"], "start_time": pid_file["startTime"]}

        if not ok:
            return {"status": "STARTING", "pid": pid_file["pid"], "port": pid_file["port"], "start_time": pid_file["startTime"]}
        elif data["status"] == "LOADING":
            return {"status": "LOADING", "pid": pid_file["pid"], "port": pid_file["port"], "start_time": pid_file["startTime"]}
        else:
            return {"status": "RUNNING", "pid": pid_file["pid"], "port": pid_file["port"], "start_time": pid_file["startTime"]}

    def check_then_start(self):
        """
        检查server的状态，然后将其启动，并阻塞线程直到server可用。
        此方法会记录调用信息，在利用server执行任何方法之前都应该首先调用它以确保server可用。
        如果启动遇到阻碍，则会抛出异常。
        """
        # 首先判断server是否处于关闭状态。如果是，触发server启动。
        self.__check_for_process()
        # 然后判断connection info是否可连通。如果不能连通，持续重试直到超时。
        self.__check_for_connection_info()
        # ok!

    def set_permanent_flag(self, value):
        """
        设置永久存续标记。用于保持服务器永久后台运行。
        :param value: 存续标记开关
        """
        self.__http_client.req("POST", "/app/lifetime/permanent", body={"type": "CLI Background Running", "value": value})

    def register_signal(self):
        """
        注册一次生命周期信号，用于暂时维持server不关闭。
        """
        self.__http_client.req("PUT", "/app/lifetime/signal/cli-lifetime-access", {"interval": 1000 * 30})

    def __get_pid_path(self):
        return os.path.join(self.__appdata_path, "channel", self.__channel.current(), "server.pid")

    def __read_pid_path(self):
        try:
            with open(self.__get_pid_path()) as f:
                return json.load(f)
        except FileNotFoundError:
            return None

    def __check_for_process(self):
        pid_file = self.__read_pid_path()
        if pid_file is None:
            bin_path = os.path.join(self.__server_path, "bin/hedge-v2-server")
            channel_path = os.path.join(self.__appdata_path, "channel", self.__channel.current())
            log_path = os.path.join(channel_path, "server.log")
            args = [bin_path, "--channel-path", channel_path, "--frontend-path", self.__frontend_path]
            log = open(log_path, "w")
            subprocess.Popen(args, stdout=log, stderr=log)

    def __check_for_connection_info(self):
        for _ in range(100):
            time.sleep(0.1)
            pid_file = self.__read_pid_path()
            if pid_file is None:
                continue
            self.__http_client.set_access(pid_file["port"], pid_file["token"])
            try:
                ok, data = self.__http_client.req("GET", "/app/health")
            except requests.RequestException:
                continue
            if ok and data["status"] == "LOADED":
                return
        raise Exception("Cannot establish connection to server. Connection timed out.")


class ServerHttpClient:
    def __init__(self):
        self.__address = None
        self.__headers = {}

    def set_access(self, port, token):
        self.__address = "http://%s:%s" % ("localhost", port)
        self.__headers = {"Authorization": "Bearer %s" % (token,)}

    def req(self, method, path, body=None):
        """
        向server发出一个HTTP请求。
        """
        if self.__address is None:
            raise Exception("Port & token is not set.")
        res = requests.request(method=method, url="%s%s" % (self.__address, path), headers=self.__headers, data=json.dumps(body) if body is not None else None)
        return res.ok, res.json()
