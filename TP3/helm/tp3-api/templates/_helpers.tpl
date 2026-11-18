{{- define "tp3-api.name" -}}{{ .Release.Name }}{{- end -}}
{{- define "tp3-api.labels" -}}
app.kubernetes.io/name: {{ include "tp3-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
