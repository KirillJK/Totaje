# Использование Kustomize для управления окружениями

Этот проект использует Kustomize для управления разными окружениями (dev, production).

## Что такое Kustomize?

Kustomize - это инструмент для настройки манифестов Kubernetes без использования шаблонов. Он позволяет создавать базовую конфигурацию и применять изменения (patches) для разных окружений.

## Структура проекта

```
k8s/
├── 00-namespace.yaml
├── 01-configmap.yaml
├── ...
├── kustomization.yaml           # Базовая конфигурация
└── overlays/
    ├── dev/
    │   └── kustomization.yaml   # Настройки для dev
    └── production/
        ├── kustomization.yaml   # Настройки для production
        └── ingress.yaml         # Дополнительные ресурсы для production
```

## Развертывание

### Development окружение

```bash
# Просмотреть манифесты без применения
kubectl kustomize k8s/overlays/dev

# Применить
kubectl apply -k k8s/overlays/dev

# Проверить статус
kubectl get pods -n jktota-dev
```

### Production окружение

```bash
# Просмотреть манифесты
kubectl kustomize k8s/overlays/production

# Применить
kubectl apply -k k8s/overlays/production

# Проверить статус
kubectl get pods -n jktota-prod
```

### Базовая конфигурация (без overlays)

```bash
# Применить базовую конфигурацию
kubectl apply -k k8s/

# Это создаст ресурсы в namespace jktota
kubectl get pods -n jktota
```

## Различия между окружениями

### Development

- **Namespace**: `jktota-dev`
- **Name Prefix**: `dev-`
- **Replicas**: 1 для всех сервисов
- **Resources**: Минимальные (128Mi RAM, 100m CPU)
- **Service Type**: NodePort (для локального доступа)
- **NODE_ENV**: `development`

### Production

- **Namespace**: `jktota-prod`
- **Name Prefix**: `prod-`
- **Replicas**: 2-3 (высокая доступность)
- **Resources**: Увеличенные (512Mi-1Gi RAM, 500m-1000m CPU)
- **Service Type**: LoadBalancer
- **NODE_ENV**: `production`
- **Ingress**: Настроен с SSL/TLS
- **Rate Limiting**: Включен

## Создание нового окружения (например, staging)

1. Создайте директорию:

```bash
mkdir -p k8s/overlays/staging
```

2. Создайте `k8s/overlays/staging/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: jktota-staging

namePrefix: staging-

commonLabels:
  environment: staging

bases:
  - ../../

patches:
  - target:
      kind: Deployment
      name: server
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 2

configMapGenerator:
  - name: jktota-config
    behavior: merge
    literals:
      - NODE_ENV=staging
      - SERVER_URL=https://staging-api.jktota.example.com
      - CLIENT_URL=https://staging.jktota.example.com
```

3. Примените:

```bash
kubectl apply -k k8s/overlays/staging
```

## Обновление конфигурации

### Обновить только dev

```bash
kubectl apply -k k8s/overlays/dev
```

### Обновить только production

```bash
kubectl apply -k k8s/overlays/production
```

### Обновить базовую конфигурацию (применится ко всем)

Отредактируйте файлы в `k8s/`, затем:

```bash
# Для dev
kubectl apply -k k8s/overlays/dev

# Для production
kubectl apply -k k8s/overlays/production
```

## Полезные команды

### Просмотр различий между окружениями

```bash
# Сравнить dev и production
diff <(kubectl kustomize k8s/overlays/dev) <(kubectl kustomize k8s/overlays/production)
```

### Генерация манифестов в файл

```bash
# Сгенерировать манифесты для production
kubectl kustomize k8s/overlays/production > production-manifests.yaml

# Применить из файла
kubectl apply -f production-manifests.yaml
```

### Проверка перед применением

```bash
# Dry-run для dev
kubectl apply -k k8s/overlays/dev --dry-run=client

# Dry-run для production
kubectl apply -k k8s/overlays/production --dry-run=server
```

### Удаление окружения

```bash
# Удалить dev окружение
kubectl delete -k k8s/overlays/dev

# Удалить production окружение
kubectl delete -k k8s/overlays/production
```

## CI/CD интеграция

### GitLab CI

```yaml
deploy:dev:
  stage: deploy
  script:
    - kubectl apply -k k8s/overlays/dev
  environment:
    name: development
  only:
    - develop

deploy:prod:
  stage: deploy
  script:
    - kubectl apply -k k8s/overlays/production
  environment:
    name: production
  only:
    - main
  when: manual
```

### GitHub Actions

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches:
      - main
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up kubectl
        uses: azure/setup-kubectl@v3

      - name: Deploy to dev
        if: github.ref == 'refs/heads/develop'
        run: kubectl apply -k k8s/overlays/dev

      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: kubectl apply -k k8s/overlays/production
```

## Настройка Secrets для разных окружений

### Вариант 1: Отдельные файлы secrets

Создайте `k8s/overlays/dev/secrets.yaml` и `k8s/overlays/production/secrets.yaml` с разными значениями.

### Вариант 2: Sealed Secrets

```bash
# Установить kubeseal
brew install kubeseal  # macOS
# или скачать с https://github.com/bitnami-labs/sealed-secrets

# Создать sealed secret для dev
kubectl create secret generic jktota-secrets \
  --from-literal=POSTGRES_PASSWORD=dev-password \
  --dry-run=client -o yaml | \
  kubeseal -o yaml > k8s/overlays/dev/sealed-secrets.yaml

# Создать sealed secret для production
kubectl create secret generic jktota-secrets \
  --from-literal=POSTGRES_PASSWORD=prod-password \
  --dry-run=client -o yaml | \
  kubeseal -o yaml > k8s/overlays/production/sealed-secrets.yaml
```

## Best Practices

1. **Не коммитьте secrets**: Используйте Sealed Secrets, External Secrets или другие инструменты для управления секретами.

2. **Версионируйте образы**: Вместо `latest` используйте конкретные теги версий в production:

```yaml
images:
  - name: jktota-server
    newTag: v1.2.3
```

3. **Тестируйте в dev**: Всегда тестируйте изменения в dev окружении перед production.

4. **Используйте dry-run**: Проверяйте изменения перед применением:

```bash
kubectl apply -k k8s/overlays/production --dry-run=server
```

5. **Документируйте изменения**: Добавляйте комментарии в kustomization.yaml для объяснения patches.

## Troubleshooting

### Ошибка "unable to find one of 'kustomization.yaml'"

Убедитесь, что вы в правильной директории:

```bash
cd k8s/overlays/dev
kubectl apply -k .
```

Или используйте полный путь:

```bash
kubectl apply -k k8s/overlays/dev
```

### Patches не применяются

Проверьте синтаксис patches:

```bash
kubectl kustomize k8s/overlays/dev
```

Убедитесь, что target указывает на правильный ресурс.

### ConfigMap/Secret не обновляется

Kustomize добавляет hash к имени ConfigMap/Secret. Убедитесь, что используете правильный behavior:

```yaml
configMapGenerator:
  - name: jktota-config
    behavior: merge  # или create, replace
```

## Дополнительные ресурсы

- [Kustomize Documentation](https://kustomize.io/)
- [Kubernetes Kustomize Guide](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/)
- [Kustomize Examples](https://github.com/kubernetes-sigs/kustomize/tree/master/examples)
