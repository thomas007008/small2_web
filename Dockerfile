# 使用官方Python镜像作为基础镜像
FROM python:3.8

# 设置工作目录
WORKDIR /usr/src/app


# 安装依赖
RUN apt-get update 
RUN apt-get install -y libcups2-dev
RUN apt-get install -y libgirepository1.0-dev
RUN apt-get install -y vim


COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码到工作目录
COPY . .

# 设置环境变量
ENV DJANGO_SETTINGS_MODULE=music_site.settings

# 开放端口
EXPOSE 8000

# 运行服务器
# CMD ["python", "manage.py", "runserver", "0.0.0.0:80"]
# CMD ["gunicorn", "music_site.wsgi:application", "--bind", "0.0.0.0:8000"]

# 使脚本可执行
RUN chmod +x ./start.sh

# 运行启动脚本
CMD ["./start.sh"]