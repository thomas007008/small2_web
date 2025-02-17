import logging
from logging.handlers import RotatingFileHandler

# 创建一个 logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# 创建一个 handler，用于写入日志文件，并设置其最大文件大小和最大备份文件数
handler = RotatingFileHandler('music_log.log', maxBytes=1024*1024*10, backupCount=10)
handler.setLevel(logging.DEBUG)


# 创建一个 handler，用于写入控制台
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# 创建一个 formatter，并将其添加到 handler 中
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

# 为 logger 添加 handler
logger.addHandler(handler)
logger.addHandler(console_handler)