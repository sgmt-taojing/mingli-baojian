
  window.onload = () => {
    SwaggerUIBundle({
      url: "/api/openapi.json",
      onComplete: function(swagger) {
        try {
          var routes = 0, tags = {};
          if (swagger && swagger.json && swagger.json.paths) {
            routes = Object.keys(swagger.json.paths).length;
            (swagger.json.tags || []).forEach(function(t){ tags[t.name] = true; });
            // 数路径上每个 tag 出现次数
            Object.values(swagger.json.paths).forEach(function(path){
              Object.values(path).forEach(function(op){
                if (op.tags) op.tags.forEach(function(t){ tags[t] = (tags[t]||0)+1; });
              });
            });
          }
          var tagCount = Object.keys(tags).length;
          var schemasCount = 0;
          if (swagger.json.components && swagger.json.components.schemas) schemasCount = Object.keys(swagger.json.components.schemas).length;
          var securitySchemes = 0;
          if (swagger.json.components && swagger.json.components.securitySchemes) securitySchemes = Object.keys(swagger.json.components.securitySchemes).length;
          document.getElementById('apiMeta').textContent = 'OpenAPI 3.0.3 · ' + routes + ' routes · ' + tagCount + ' tags · ' + schemasCount + ' schemas · ' + securitySchemes + ' securitySchemes';
        } catch(e) { /* ignore */ }
      },
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis
      ],
      layout: "BaseLayout",
      docExpansion: "list",
      operationsSorter: "alpha",
      tagsSorter: "alpha",
      filter: true,
      tryItOutEnabled: true,
      requestInterceptor: (req) => {
        try {
          const csrf = document.cookie.match(/csrf_token=([^;]+)/);
          if (csrf && (req.url.includes('/api/') && !req.url.includes('/api/public/') && !req.url.includes('/api/csrf-token'))) {
            req.headers['X-CSRF-Token'] = csrf[1];
          }
        } catch (e) {}
        return req;
      }
    });
  };
