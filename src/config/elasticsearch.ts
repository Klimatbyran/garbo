export default {
  // k port-forward elasticsearch-master-0 9200 -n data-pipeline

  node: process.env.ELASTICSEARCH_HOST || 'http://127.0.0.1:9200',
}
