import os.path
from module.cli_data import CliData


class ChannelManager:
    """
    提供channel的管理和信息查询。
    """
    def __init__(self, appdata_path: str, cli_data: CliData):
        self.__channel_dir = os.path.join(appdata_path, "channel")
        self.__cli_data = cli_data

    def use(self, channel_name: str):
        """
        切换正在使用的频道。
        """
        self.__cli_data.data["use_channel"] = channel_name
        self.__cli_data.save()

    def current(self):
        """
        查看当前正在使用的频道。
        """
        return self.__cli_data.data["use_channel"] or "default"

    def list(self):
        """
        查看频道列表。
        """
        return [i.name for i in os.scandir(self.__channel_dir) if i.is_dir()]
