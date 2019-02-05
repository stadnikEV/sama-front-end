
const httpRequest = () => {
  if (window.httpRequest) {
    return window.httpRequest;
  }

  class HttpRequest {
    get({ url, options = {} }) {
      options.method = 'get';
      const params = this.prepareParams(options);

      return this.request(url, params);
    }


    post({ url, options = {} }) {
      options.method = 'post';
      const params = this.prepareParams(options);
      return this.request(url, params);
    }


    put({ url, options = {} }) {
      options.method = 'put';
      const params = this.prepareParams(options);

      return this.request(url, params);
    }


    delete({ url, options = {} }) {
      options.method = 'delete';
      options.credentials = 'include';

      return this.request(url, options);
    }


    prepareParams({ contentType = 'application/json', data, method }) {
      const params = {
        method,
        credentials: 'include',
        headers: {},
      };

      if (contentType !== 'setByBrowser') {
        params.headers['Content-Type'] = contentType;
      }

      if (contentType === 'application/json' && data) {
        params.body = JSON.stringify(data);
      }
      if (contentType === 'video/webm' || contentType === 'setByBrowser') {
        params.body = data;
      }

      return params;
    }


    request(url, options) {
      let response = null;
      let dataType = null;

      const promise = new Promise((resolve, reject) => {
        fetch(url, options)
          .then((res) => {
            response = res;
            dataType = response.headers.get('content-type');
            if (dataType === 'application/json; charset=utf-8') {
              const json = response.json();
              return json;
            }
            return response.arrayBuffer();
          })
          .then((responeData) => {
            if (response.status !== 200 && response.status !== 201) {
              if (dataType === 'application/json; charset=utf-8') {
                return Promise.reject();
              }
            }
            return resolve(responeData);
          })
          .catch((err) => {
            reject(err);
          });
      });

      return promise;
    }
  }

  window.httpRequest = new HttpRequest();
  return window.httpRequest;
};

export default httpRequest();
