{{- define "tp4-api.name" -}}{{ .Release.Name }}{{- end -}}
{{- define "tp4-api.labels" -}}
app.kubernetes.io/name: {{ include "tp4-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
