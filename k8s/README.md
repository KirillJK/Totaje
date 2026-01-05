# Kubernetes Deployment для JKtota

Этот каталог содержит манифесты Kubernetes для развертывания приложения JKtota.

## Предварительные требования

1. Kubernetes кластер (v1.24+)
2. kubectl настроенный для работы с вашим кластером
3. Docker образы приложений:
   - `jktota-server:latest`
   - `jktota-client:latest`
   - `jktota-youtube-service:latest`
   - `jktota-telegram-bot:latest`

## Структура манифестов

```
k8s/
├── 00-namespace.yaml                  # Namespace
├── 01-configmap.yaml                  # ConfigMap с настройками
├── 02-secrets.yaml                    # Secrets с чувствительными данными
├── 03-persistent-volumes.yaml         # PersistentVolumeClaims
├── 04-postgres-init-scripts.yaml      # ConfigMap с SQL скриптами
├── 10-postgres.yaml                   # PostgreSQL Deployment и Service
├── 20-youtube-service.yaml            # YouTube Service Deployment и Service
├── 30-server.yaml                     # Server Deployment и Service
├── 40-client.yaml                     # Client Deployment и Service
├── 50-telegram-bot.yaml               # Telegram Bot Deployment
└── README.md                          # Данная инструкция
```

## Быстрый старт

### 1. Создание Docker образов

Сначала создайте все необходимые Docker образы:

```bash
# Из корневой директории проекта

# Server
docker build -t jktota-server:latest -f server/Dockerfile .

# Client
docker build -t jktota-client:latest -f client/Dockerfile ./client

# YouTube Service
docker build -t jktota-youtube-service:latest -f youtube-service/Dockerfile ./youtube-service

# Telegram Bot
docker build -t jktota-telegram-bot:latest -f telegram-bot/Dockerfile ./telegram-bot
```

### 2. Загрузка образов в registry

Если вы используете удаленный кластер, загрузите образы в container registry:

```bash
# Пример для Docker Hub
docker tag jktota-server:latest your-username/jktota-server:latest
docker push your-username/jktota-server:latest

# Повторите для всех образов
```

Затем обновите ссылки на образы в манифестах (файлы 20-50).

### 3. Настройка Secrets

**ВАЖНО:** Перед развертыванием обновите файл `02-secrets.yaml` с вашими реальными значениями:

```yaml
# В файле 02-secrets.yaml замените:
- POSTGRES_PASSWORD на безопасный пароль
- SESSION_SECRET на случайную строку
- GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET на ваши значения из Google Cloud Console
- TODOIST_API_TOKEN на ваш токен Todoist
- TELEGRAM_BOT_TOKEN на токен вашего бота от @BotFather
```

### 4. Развертывание

Примените все манифесты в правильном порядке:

```bash
# Применить все манифесты
kubectl apply -f k8s/

# Или применить по порядку
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml
kubectl apply -f k8s/03-persistent-volumes.yaml
kubectl apply -f k8s/04-postgres-init-scripts.yaml
kubectl apply -f k8s/10-postgres.yaml
kubectl apply -f k8s/20-youtube-service.yaml
kubectl apply -f k8s/30-server.yaml
kubectl apply -f k8s/40-client.yaml
kubectl apply -f k8s/50-telegram-bot.yaml
```

### 5. Проверка статуса

```bash
# Проверить все pod'ы в namespace jktota
kubectl get pods -n jktota

# Проверить все сервисы
kubectl get svc -n jktota

# Проверить PVC
kubectl get pvc -n jktota

# Посмотреть логи конкретного pod'а
kubectl logs -n jktota <pod-name>

# Следить за логами в реальном времени
kubectl logs -n jktota <pod-name> -f
```

### 6. Доступ к приложению

После успешного развертывания:

```bash
# Получить внешний IP клиента (если используется LoadBalancer)
kubectl get svc client -n jktota

# Или использовать port-forward для локального доступа
kubectl port-forward -n jktota svc/client 8080:80
# Приложение будет доступно на http://localhost:8080
```

## Управление

### Обновление приложения

```bash
# Пересобрать образ
docker build -t jktota-server:latest -f server/Dockerfile .

# Загрузить в registry (если используется)
docker push your-username/jktota-server:latest

# Перезапустить deployment
kubectl rollout restart deployment/server -n jktota

# Проверить статус обновления
kubectl rollout status deployment/server -n jktota
```

### Масштабирование

```bash
# Увеличить количество реплик server
kubectl scale deployment/server -n jktota --replicas=3

# Увеличить количество реплик client
kubectl scale deployment/client -n jktota --replicas=3
```

### Просмотр логов

```bash
# Логи всех pod'ов определенного deployment
kubectl logs -n jktota -l app=server --tail=100

# Логи с следованием
kubectl logs -n jktota -l app=telegram-bot -f

# Логи PostgreSQL
kubectl logs -n jktota -l app=postgres
```

### Выполнение команд в контейнере

```bash
# Подключиться к PostgreSQL
kubectl exec -it -n jktota deployment/postgres -- psql -U jktota -d jktota_db

# Открыть shell в контейнере
kubectl exec -it -n jktota deployment/server -- /bin/sh
```

## Настройка для production

### 1. Использование Ingress вместо LoadBalancer

Создайте файл `60-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: jktota-ingress
  namespace: jktota
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - jktota.example.com
    secretName: jktota-tls
  rules:
  - host: jktota.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: client
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: server
            port:
              number: 3000
```

### 2. Использование внешних Secrets

Вместо хранения секретов в git, используйте:
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
- Секреты из cloud provider (AWS Secrets Manager, Google Secret Manager и т.д.)

### 3. Настройка мониторинга

```bash
# Установить Prometheus и Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

### 4. Backup базы данных

Создайте CronJob для резервного копирования:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: jktota
spec:
  schedule: "0 2 * * *"  # Каждый день в 2:00
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: jktota-secrets
                  key: POSTGRES_PASSWORD
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h postgres -U jktota jktota_db > /backup/backup-$(date +%Y%m%d-%H%M%S).sql
            volumeMounts:
            - name: backup
              mountPath: /backup
          restartPolicy: OnFailure
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: postgres-backup
```

## Удаление развертывания

```bash
# Удалить все ресурсы
kubectl delete -f k8s/

# Или удалить namespace (удалит все ресурсы внутри)
kubectl delete namespace jktota
```

## Troubleshooting

### Pod не запускается

```bash
# Описание pod'а с подробной информацией
kubectl describe pod -n jktota <pod-name>

# События в namespace
kubectl get events -n jktota --sort-by='.lastTimestamp'
```

### База данных не инициализируется

```bash
# Проверить логи PostgreSQL
kubectl logs -n jktota -l app=postgres

# Проверить, применились ли init скрипты
kubectl exec -it -n jktota deployment/postgres -- psql -U jktota -d jktota_db -c "\dt"
```

### PersistentVolume не создается

```bash
# Проверить статус PVC
kubectl get pvc -n jktota

# Описание PVC
kubectl describe pvc -n jktota <pvc-name>

# Проверить доступные StorageClass
kubectl get storageclass
```

### Сервисы не могут связаться друг с другом

```bash
# Проверить DNS
kubectl run -it --rm debug --image=busybox --restart=Never -n jktota -- nslookup postgres.jktota.svc.cluster.local

# Проверить сетевые политики
kubectl get networkpolicies -n jktota
```

## Дополнительные ресурсы

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
