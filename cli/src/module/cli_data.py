import json
import os


class CliData:
    """
    提供对cli.json中的数据项的读写。
    """
    def __init__(self, appdata_path: str):
        self.__cli_data_path = os.path.join(appdata_path, "cli.json")
        try:
            with open(self.__cli_data_path) as f:
                self.data = json.load(f)
        except FileNotFoundError:
            self.data = {
                "use_channel": None
            }

    def save(self):
        with open(self.__cli_data_path, "w") as f:
            json.dump(self.data, f)
