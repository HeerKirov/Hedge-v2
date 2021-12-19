import json
import platform
import os


app_name = "Hedge-v2"


class LocalConfig:
    """
    通过综合local config文件中的配置，确定所使用的各种关键配置的位置，包括appdata目录、server目录、app目录。
    配置是一次读取且只读的。
    """
    def __init__(self):
        local_config_path = os.path.join(os.path.split(os.path.realpath(__file__))[0], "../../conf.local.json")
        try:
            with open(local_config_path) as f:
                conf = json.load(f)
            self.debug_mode = conf.get("debugMode", False)
            self.userdata_path = conf.get("userdataPath", None) or os.path.join(get_system_appdata_dir(), app_name)
            self.server_path = conf.get("serverPath", None) or os.path.join(self.userdata_path, "server")
            self.frontend_path = conf.get("frontendPath", None) or os.path.join(self.userdata_path, "server/frontend")
            self.appdata_path = conf.get("appdataPath", None) or os.path.join(self.userdata_path, "appdata")
            self.app_path = conf.get("appPath", None)
        except FileNotFoundError:
            raise FileNotFoundError("'conf.local.json' configuration is not found.")


def get_system_appdata_dir():
    system = platform.system()
    if system == "Linux":
        return os.path.join(os.environ['HOME'], ".config")
    if system == "Darwin":
        return os.path.join(os.environ['HOME'], "Library/Application Support")
    else:
        return None


