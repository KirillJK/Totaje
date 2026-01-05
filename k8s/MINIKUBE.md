# Развертывание в Minikube

Инструкции для локального развертывания JKtota в Minikube.

## Установка Minikube

### Windows

```bash
# С помощью Chocolatey
choco install minikube

# Или скачайте с официального сайта
# https://minikube.sigs.k8s.io/docs/start/
```

### Linux

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

### macOS

```bash
brew install minikube
```

## Запуск Minikube

```bash
# Запустить Minikube с достаточными ресурсами
minikube start --memory=4096 --cpus=4

# Включить addons
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable storage-provisioner

# Проверить статус
minikube status
```

## Настройка Docker для Minikube

```bash
# Использовать Docker daemon из Minikube
# Это позволяет не загружать образы в registry
eval $(minikube docker-env)

# Теперь создайте образы
cd /path/to/jktota

docker build -t jktota-server:latest -f server/Dockerfile .
docker build -t jktota-client:latest -f client/Dockerfile ./client
docker build -t jktota-youtube-service:latest -f youtube-service/Dockerfile ./youtube-service
docker build -t jktota-telegram-bot:latest -f telegram-bot/Dockerfile ./telegram-bot

# Проверить, что образы доступны в Minikube
docker images | grep jktota
```

## Развертывание

```bash
# Применить все манифесты
kubectl apply -f k8s/

# Проверить статус
kubectl get pods -n jktota -w
```

## Доступ к приложению

### Вариант 1: Port Forward

```bash
# Прокинуть порт клиента
kubectl port-forward -n jktota svc/client 8080:80

# Открыть в браузере
# http://localhost:8080
```

### Вариант 2: Minikube Service

```bash
# Получить URL сервиса
minikube service client -n jktota --url

# Или открыть в браузере автоматически
minikube service client -n jktota
```

### Вариант 3: Ingress (если настроен)

```bash
# Получить IP Minikube
minikube ip

# Добавить в /etc/hosts (Linux/Mac) или C:\Windows\System32\drivers\etc\hosts (Windows)
# <minikube-ip> jktota.local api.jktota.local

# Применить Ingress
kubectl apply -f k8s/60-ingress.yaml

# Открыть в браузере
# http://jktota.local
```

## Мониторинг

### Dashboard

```bash
# Открыть Kubernetes Dashboard
minikube dashboard
```

### Логи

```bash
# Логи всех сервисов
kubectl logs -n jktota -l app=server --tail=50
kubectl logs -n jktota -l app=youtube-service --tail=50
kubectl logs -n jktota -l app=telegram-bot --tail=50
kubectl logs -n jktota -l app=postgres --tail=50

# Следить за логами
kubectl logs -n jktota -l app=telegram-bot -f
```

### Доступ к базе данных

```bash
# Подключиться к PostgreSQL
kubectl exec -it -n jktota deployment/postgres -- psql -U jktota -d jktota_db

# Или через port-forward
kubectl port-forward -n jktota svc/postgres 5432:5432

# Теперь можно подключиться локально
psql -h localhost -U jktota -d jktota_db
# Пароль: jktota123 (или из вашего secrets.yaml)
```

## Обновление приложения

```bash
# После изменения кода пересоберите образ
eval $(minikube docker-env)
docker build -t jktota-server:latest -f server/Dockerfile .

# Удалить pod для перезапуска с новым образом
kubectl delete pod -n jktota -l app=server

# Или использовать rollout restart
kubectl rollout restart deployment/server -n jktota
```

## Очистка

```bash
# Удалить все ресурсы
kubectl delete namespace jktota

# Или удалить Minikube полностью
minikube stop
minikube delete
```

## Troubleshooting

### ImagePullBackOff ошибка

Убедитесь, что вы используете Docker из Minikube:

```bash
eval $(minikube docker-env)
docker images | grep jktota
```

Если образы не отображаются, пересоберите их.

### PersistentVolume не создается

```bash
# Проверить StorageClass
kubectl get storageclass

# Minikube должен иметь 'standard' StorageClass по умолчанию
# Если нет, включите addon
minikube addons enable storage-provisioner
```

### Pods находятся в состоянии Pending

```bash
# Проверить события
kubectl get events -n jktota --sort-by='.lastTimestamp'

# Проверить ресурсы
kubectl describe pod -n jktota <pod-name>

# Возможно, нужно увеличить ресурсы Minikube
minikube stop
minikube start --memory=8192 --cpus=4
```

### База данных не инициализируется

```bash
# Проверить логи PostgreSQL
kubectl logs -n jktota -l app=postgres

# Проверить ConfigMap с init скриптами
kubectl get configmap postgres-init-scripts -n jktota -o yaml

# Пересоздать PostgreSQL pod
kubectl delete pod -n jktota -l app=postgres
```

## Полезные команды

```bash
# SSH в Minikube VM
minikube ssh

# Открыть Docker образы в Minikube
minikube ssh
docker images

# Проверить используемые ресурсы
kubectl top nodes
kubectl top pods -n jktota

# Получить все ресурсы в namespace
kubectl get all -n jktota

# Описание всех ресурсов
kubectl describe all -n jktota
```

## Production vs Development

Для development в Minikube можно изменить некоторые настройки:

### Уменьшить replicas

```yaml
# В файлах deployment измените replicas на 1
replicas: 1
```

### Уменьшить resources

```yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "128Mi"
    cpu: "100m"
```

### Использовать NodePort вместо LoadBalancer

```yaml
# В 40-client.yaml
spec:
  type: NodePort  # Вместо LoadBalancer
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080  # Опционально: фиксированный порт
```

Затем доступ:

```bash
minikube service client -n jktota
```
