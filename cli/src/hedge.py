import subprocess
import sys
import time
import click
import os
from module.cli_data import CliData
from module.local_config import LocalConfig
from module.channel import ChannelManager
from module.server import Server
from module.apply import Applier


@click.group("hedge", help="Hedge App 命令行管理工具 (CLI)")
def app():
    pass


@app.command("app", help="启动Hedge App")
def start_app():
    if local_config.app_path is None:
        print("'app_path'未配置，无法启动app。")
        exit(1)
    exec_path = os.path.join(os.path.realpath(local_config.app_path), "hedge")
    channel_name = channel_manager.current()
    if local_config.debug_mode:
        args = [exec_path, "--debug-mode", "--channel", channel_name, "--local-data-path", local_config.userdata_path]
    else:
        args = [exec_path, "--channel", channel_name]
    subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


@app.command("apply", help="应用文件以导入或更新数据")
@click.option("--directory", "-d", help="指定一个目录，读取该目录下的所有可识别文件以应用更改")
@click.option("--file", "-f", help="指定一个文件，读取该文件内容以应用更改")
@click.option("-i", is_flag=True, help="从输入流读取内容以应用更改")
@click.option("-q", is_flag=True, help="不显示任何输出")
def apply(directory, file, i, q):
    applier = Applier(server)
    if i:
        applier.apply(sys.stdin.read())
    if file is not None:
        with open(file) as f:
            applier.apply(f.read())
    if directory is not None:
        for _, dirs, non_dirs in os.walk(directory):
            for i in non_dirs:
                if i.endswith('.yml') or i.endswith('.yaml'):
                    with open(i) as f:
                        applier.apply(f.read())
    server.check_then_start()
    server.register_signal()
    applier.submit()

    if applier.updated.get('setting', None) is not None:
        print("* 已更新%s个设置项。" % (applier.updated['setting'],))
    if applier.updated.get('source', None) is not None:
        print("* 已更新%s个来源数据项。" % (applier.updated['source'],))
    if applier.updated.get('annotation', None) is not None:
        print("* 已更新%s个注解项。" % (applier.updated['annotation'],))
    if applier.updated.get('author', None) is not None:
        print("* 已更新%s个作者项。" % (applier.updated['author'],))
    if applier.updated.get('topic', None) is not None:
        print("* 已更新%s个主题项。" % (applier.updated['topic'],))
    if applier.updated.get('tag', None) is not None:
        print("* 已更新%s个标签项。" % (applier.updated['tag'],))
    if applier.created.get('setting', None) is not None:
        print("* 已添加%s个设置项。" % (applier.created['setting'],))
    if applier.created.get('source', None) is not None:
        print("* 已添加%s个来源数据项。" % (applier.created['source'],))
    if applier.created.get('annotation', None) is not None:
        print("* 已添加%s个注解项。" % (applier.created['annotation'],))
    if applier.created.get('author', None) is not None:
        print("* 已添加%s个作者项。" % (applier.created['author'],))
    if applier.created.get('topic', None) is not None:
        print("* 已添加%s个主题项。" % (applier.created['topic'],))
    if applier.created.get('tag', None) is not None:
        print("* 已添加%s个标签项。" % (applier.created['tag'],))
    if len(applier.submit_errors) > 0:
        for e in applier.submit_errors:
            print("* 错误项%s [%s]: %s" % e)


@app.group("channel", help="Hedge CLI 频道控制")
def channel():
    pass


@channel.command("info", help="查看所有频道和当前所用的频道")
def channel_info():
    print("正在使用的频道: %s" % (channel_manager.current(),))
    channels = channel_manager.list()
    if len(channels) > 0:
        print("频道列表:")
        for channel_name in channels:
            print(" - %s" % (channel_name,))
    else:
        print("频道列表为空。")


@channel.command("use", help="更改所用的频道")
@click.argument("channel_name")
def channel_use(channel_name):
    channel_manager.use(channel_name)


@app.group("server", help="Hedge 后台服务进程控制")
def server():
    pass


@server.command("status", help="查看后台进程状态")
def server_status():
    stat = server.status()
    print("运行状态: %s" % (stat["status"],))
    if stat["status"] != "STOP":
        print()
        if "pid" in stat:
            print("进程PID: %s" % (stat["pid"],))
        if "port" in stat:
            print("进程Port: %s" % (stat["port"],))
        if "start_time" in stat:
            millis = int(time.time() - stat["start_time"] / 1000)
            seconds = millis % 60
            minutes = (millis % 3600) // 60
            hours = millis // 3600
            print("已运行时长: %02d:%02d:%02d" % (hours, minutes, seconds))


@server.command("start", help="启动后台服务进程，使其常驻后台")
def server_start():
    server.check_then_start()
    server.set_permanent_flag(True)


@server.command("stop", help="关闭后台服务进程，停止后台常驻")
def server_stop():
    if server.status()["status"] == "RUNNING":
        server.set_permanent_flag(False)


if __name__ == "__main__":
    local_config = LocalConfig()
    cli_data = CliData(local_config.app_path)
    channel_manager = ChannelManager(local_config.appdata_path, cli_data)
    server = Server(local_config, channel_manager)
    app()
