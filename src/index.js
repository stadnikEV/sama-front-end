const pubSub = window.PubSub;

class AddCompany {
  constructor() {
    const addCompanyButton = document.querySelector('.add-company');
    addCompanyButton.addEventListener('click', this.addCompany.bind(this));

    this.dbReadyElem = document.querySelector('.db-ready');
    this.indexElem = document.querySelector('.index');
    const nextCompanyButton = document.querySelector('.next-company');
    nextCompanyButton.addEventListener('click', this.goToCompany.bind(this, { mode: 'next' }));
    const prevCompanyButton = document.querySelector('.prev-company');
    prevCompanyButton.addEventListener('click', this.goToCompany.bind(this, { mode: 'prev' }));
    const goToCompanyButton = document.querySelector('.button-go-to');
    goToCompanyButton.addEventListener('click', this.goToPos.bind(this));
    this.inputGoToCompany = document.querySelector('.input-go-to');
    this.template = document.querySelector('.template');
    this.inputAutoFrom = document.querySelector('.input-auto-from');
    this.inputAutoTo = document.querySelector('.input-auto-to');
    this.autoIndicate = document.querySelector('.auto-idicate');

    this.buttonStart = document.querySelector('.button-start');
    this.buttonStart.addEventListener('click', this.autoStart.bind(this));

    this.buttonStop = document.querySelector('.button-stop');
    this.buttonStop.addEventListener('click', this.autoStop.bind(this));


    this.checkBitrixData = document.querySelector('.check-bitrix-data');
    this.sendedElem = document.querySelector('.sended');

    this.inputTitle = document.querySelector('.company');
    this.inputEmail = document.querySelector('.email');
    this.inputComments = document.querySelector('.comments');

    this.matchCompanyContainer = document.querySelector('.match-company-container');
    this.matchCompany = document.querySelector('.match-company');
    this.buttonRemoveMatch = document.querySelector('.button-remove-match');

    this.buttonRemoveMatch.addEventListener('click', this.removeMatchElem.bind(this));

    this.webhookInput = document.querySelector('.webhook-input');
    this.daleyElem = document.querySelector('.daley');
    this.daleyContainerElem = document.querySelector('.daley-container');

    this.daleyFromElem = document.querySelector('.input-daley-from');
    this.daleyFromTo = document.querySelector('.input-daley-to');

    this.showMatchesContainer = document.querySelector('.show-matches-container');
    this.fullMatch = document.querySelector('.full-match');

    this.buttonRefresh = document.querySelector('.button-refresh');
    this.refreshTextElem = document.querySelector('.refresh-text');
    this.buttonRefresh.addEventListener('click', this.updateData.bind(this));


    this.index = 0;
    this.email = null;
    this.sended = 0;
    this.isAdded = false;
    this.statusData = {
      email: false,
      company: false,
    };
    this.match = {};


    this.matchCompany.addEventListener('click', this.onChoosMatch.bind(this));

    pubSub.subscribe('notValidMail', this.nextCompany.bind(this));
    pubSub.subscribe('notValidData', this.nextCompany.bind(this));
    pubSub.subscribe('dataOk', () => {
      this.addCompany();
    });
    pubSub.subscribe('isAdded', this.nextCompany.bind(this));
    pubSub.subscribe('notValidCompany', this.nextCompany.bind(this));


    this.getDataBase()
      .then((data) => {
        this.dataBase = data;
        return;
      })
      .then(() => {
        return this.getBitrixDB();
      })
      .then((data) => {
        this.BitrixDataBase = JSON.parse(data);
        this.dbReadyElem.textContent = 'БАЗА ДАННЫХ ЗАГРУЖЕНА';
        this.dbReadyElem.classList.add('loaded');
        this.dbReady = true;
        this.goToCompany({ mode: 'goTo', pos: 0 });
      })
      .catch((e) => {
        console.warn(e);
      });
  }

  getDataBase() {
    return new Promise((resolve, reject) => {
      this.request({
        url: 'http://localhost:8080/getDataBase',
        method: 'post',
      })
        .then((json) => {
          resolve(json);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  getBitrixDB() {
    return new Promise((resolve, reject) => {
      this.request({
        url: 'http://localhost:8080/getBitrixDB',
        method: 'post',
      })
        .then((json) => {
          resolve(json);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  parseEmail({ email }) {
    const emailArr = email.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g);
    return emailArr;
  }

  autoStart(e) {
    e.preventDefault();
    if (!this.dataBase || !this.dbReady || this.isPanding) {
      return;
    }
    if (this.webhookInput.value === '') {
      this.checkBitrixData.textContent = 'Подключите webHook';
      return;
    }
    if (this.auto) {
      return;
    }
    if (this.matchElem) {
      this.matchDeselect();
    }
    this.autoIndicate.classList.add('active');
    this.auto = true;
    this.startPos = parseInt(this.inputAutoFrom.value, 10) - 1;
    this.endPos = parseInt(this.inputAutoTo.value, 10) - 1;
    this.goToCompany({ mode: 'goTo', pos: this.startPos });
  }

  nextCompany() {
    if (this.stopAuto) {
      this.stopAuto = false;
      this.auto = false;
      this.autoIndicate.classList.remove('active');
      return;
    }
    const currentPos = this.index + 1;
    if (currentPos > this.endPos) {
      this.auto = false;
      this.autoIndicate.classList.remove('active');
      return;
    }
    let dalayFrom = this.daleyFromElem.value;
    let dalayTo = this.daleyFromTo.value;
    if (dalayFrom === '' || dalayTo === '') {
      dalayFrom = 500;
      dalayTo = 1000;
    } else {
      dalayFrom = parseInt(dalayFrom, 10) * 1000;
      dalayTo = parseInt(dalayTo, 10) * 1000;
    }

    const delay = dalayFrom + ((dalayTo - dalayFrom) * Math.random());
    this.showDaley(delay);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.goToCompany({ mode: 'goTo', pos: currentPos });
    }, delay);
  }

  showDaley(delay) {
    let delaySeconds = delay / 1000;
    this.daleyElem.textContent = delaySeconds.toFixed(1);
    this.daleyContainerElem.classList.remove('hide');
    this.interval = setInterval(() => {
      delaySeconds -= 0.1;
      if (delaySeconds < 0.1) {
        clearInterval(this.interval);
        this.interval = null;
        this.daleyContainerElem.classList.add('hide');
      }
      this.daleyElem.textContent = delaySeconds.toFixed(1);
    }, 100);
  }

  autoStop() {
    if (!this.auto) {
      return;
    }
    this.stopAuto = true;
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.interval);
      this.daleyContainerElem.classList.add('hide');
      this.autoIndicate.classList.remove('active');
      this.timer = null;
      this.interval = null;
      this.stopAuto = false;
      this.auto = false;
    }
  }

  goToPos(e) {
    if (!this.dataBase || !this.dbReady || this.isPanding) {
      return;
    }
    e.preventDefault();
    let index = this.inputGoToCompany.value;

    if (index === '') {
      this.checkBitrixData.textContent = 'Ошибка: задайте позицию';
      return;
    }
    if (this.matchElem) {
      this.matchDeselect();
    }
    index = parseInt(this.inputGoToCompany.value, 10) - 1;

    if (index < 1) {
      index = 0;
    }
    if (index > this.dataBase.length) {
      index = this.dataBase.length - 1;
    }
    this.goToCompany({ mode: 'goTo', pos: index });
  }

  goToCompany({ mode, pos }) {
    if (!this.dataBase || !this.dbReady || this.isPanding) {
      return;
    }
    this.fullMatch.innerHTML = '';
    this.checkBitrixData.textContent = ' Идет проверка данных';
    let data = null;

    if (mode === 'next') {
      if (this.matchElem) {
        this.matchDeselect();
      }
      this.index += 1;
      data = this.dataBase[this.index];
    }
    if (mode === 'prev') {
      if (this.matchElem) {
        this.matchDeselect();
      }
      this.index -= 1;
      if (this.index < 0) {
        this.index = 0;
      }
      data = this.dataBase[this.index];
    }
    if (mode === 'goTo') {
      this.index = pos;
      data = this.dataBase[this.index];
    }
    this.isPanding = true;
    this.statusData = {
      email: false,
      company: false,
    };
    this.showMatchesContainer.classList.add('hidden');
    this.isAdded = false;
    this.indexElem.textContent = this.index + 1;
    this.title = data.Компания;
    this.email = this.parseEmail({ email: data.Почта });
    this.name = data.ФИО;
    this.city = data.Город;
    this.industry = data.Отрасль;

    this.addToForm({
      title: this.title,
      email: this.email,
      comments: this.name,
      city: this.city,
      industry: this.industry,
    });


    this.checkData()
      .then(() => {
        return this.getCompanyByEmail({ email: this.email });
      })
      .then((dataFromBitrix) => {
        return new Promise((resolve, reject) => {
          if (dataFromBitrix.result.length === 0) {
            this.statusData.email = true;
            this.checkBitrixData.textContent = 'emai ok';
            resolve();
            return;
          }
          reject('такой emai существует');
        });
      })
      .then(() => {
        return this.getCompanyByTitle({ TITLE: this.title })
      })
      .then((dataFromBitrix) => {
        return new Promise((resolve, reject) => {
          const fullMatch = dataFromBitrix.result;
          this.fullMatchNameFilter = this.getFullMatchNameFilter(fullMatch);

          let ExcelMatch = this.searchMathesExcel();


          if (this.fullMatchNameFilter.length === 0 && ExcelMatch.length === 0) {
            this.statusData.company = true;
            this.checkBitrixData.textContent = 'компания ok';
            resolve();
            return;
          }
          this.addMatchCompany();
          if (this.fullMatchNameFilter.length !== 0) {
            this.showMathesBitrix(fullMatch);
          }
          if (ExcelMatch.length !== 0) {
            this.showMathesExcel(ExcelMatch);
          }
          reject('такая компания существует');
        });
      })
      .then(() => {
        this.isPanding = false;
        if (this.auto) {
          if (this.stopAuto) {
            this.autoIndicate.classList.remove('active');
            this.stopAuto = false;
            this.auto = false;
            return;
          }
          pubSub.publish('dataOk');
          return;
        }
        setTimeout(() => {
          this.checkBitrixData.textContent = 'данные ok';
        }, 1000);
      })
      .catch((e) => {
        this.isPanding = false;
        console.warn(e);
        if (typeof e === 'string') {
          this.checkBitrixData.textContent = `Ошибка:  ${e}`;
          if (!this.auto) {
            return;
          }
          if (this.stopAuto) {
            this.autoIndicate.classList.remove('active');
            this.stopAuto = false;
            this.auto = false;
            return;
          }
          if (e === 'такой emai существует') {
            setTimeout(() => {
              pubSub.publish('notValidMail');
            }, 1000);
          }
          if (e === 'такая компания существует') {
            setTimeout(() => {
              pubSub.publish('notValidCompany');
            }, 1000);
          }
          if (e === 'Не корректные данные в Эксель') {
            setTimeout(() => {
              pubSub.publish('notValidData');
            }, 1000);
          }
        }
      });
  }

  addToForm({ title, email, comments, city, industry }) {
    if (title !== '') {
      this.inputTitle.value = title;
    } else {
      this.inputTitle.value = '';
    }
    if (comments !== '') {
      this.inputComments.value = `${comments}<br><br>\n\n${this.template.value} ${city}<br>\n${industry}`;
    } else {
      this.inputComments.value = '';
    }
    if (email !== null) {
      this.inputEmail.textContent = email[0];
      for (let i = 1; i < email.length; i += 1) {
        this.inputEmail.textContent += `\n${email[i]}`;
      }
    } else {
      this.inputEmail.textContent = '';
    }
  }

  checkData() {
    return new Promise((resolve, reject) => {
      if (this.email !== null && this.name !== '') {
        resolve();
        return;
      }
      this.checkBitrixData.textContent = 'Не корректные данные в Эксель';
      this.isPanding = false;
      // this.email = [data.Почта];
      reject('Не корректные данные в Эксель');
    });
  }

  getCompanyByTitle({ TITLE }) {
    const data = {
      order: { DATE_CREATE: 'ASC' },
      filter: { TITLE },
      select: ['TITLE', 'EMAIL', 'COMMENTS'],
    };

    return new Promise((resolve, reject) => {
      if (this.webhookInput.value === '') {
        this.checkBitrixData.textContent = 'Подключите webHook';
        reject('Подключите webHook');
        return;
      }
      this.request({
        url: `${this.webhookInput.value}/crm.company.list`,
        method: 'post',
        data,
      })
        .then((json) => {
          setTimeout(() => {
            resolve(json);
          }, 1000);
        })
        .catch((e) => {
          setTimeout(() => {
            reject(e);
          }, 1000);
        });
    });
  }

  getCompanyByEmail({ email }) {
    const data = {
      order: { DATE_CREATE: 'ASC' },
      filter: { EMAIL: email[0] },
      select: ['TITLE', 'EMAIL', 'COMMENTS'],
    };

    return new Promise((resolve, reject) => {
      const loopIndex = email.length - 1;
      let i = 0;
      if (this.webhookInput.value === '') {
        this.checkBitrixData.textContent = 'Подключите webHook';
        reject('Подключите webHook');
        return;
      }

      const asyncLoop = function async({ timing }) { // асинхронный цикл
        setTimeout(() => {
          this.request({
            url: `${this.webhookInput.value}/crm.company.list`,
            method: 'post',
            data,
          })
            .then((json) => {
              if (json.result.length === 0 && i < loopIndex) {
                i += 1;
                data.filter.EMAIL = email[i];
                async.call(this, { timing: 1000 });
                return;
              }
              setTimeout(() => {
                resolve(json);
              }, 1000);
            })
            .catch((e) => {
              setTimeout(() => {
                reject(e);
              }, 1000);
            });
        }, timing);
      };

      asyncLoop.call(this, { timing: 0 });
    });
  }

  addCompany() {
    if (this.isPanding) {
      return;
    }
    if (this.isAdded) {
      this.checkBitrixData.textContent = 'Данные уже добавлены битрикс24';
      return;
    }

    if (!this.statusData.email || !this.statusData.company || this.template.value === '') {
      if (this.auto) {
        this.stopAuto = false;
        this.auto = false;
      }
      this.autoIndicate.classList.remove('active');
      let message = null;
      if (this.template.value === '') {
        message = 'шаблон пуст';
      }
      if (!this.statusData.company) {
        message = 'недопустимая компания';
      }
      if (!this.statusData.email) {
        message = 'недопустимый email';
      }
      this.checkBitrixData.textContent = `Ошибка:  данные не отправлены (${message})`;

      const conf = confirm(`${message}. Отправить?`);

      if (!conf) {
        return;
      }
      if (this.matchElem) {
        this.removeMatchElem();
      }
    }

    const data = {
      fields: {
        TITLE: this.inputTitle.value,
        COMMENTS: this.inputComments.value,
        EMAIL: [],
      },
    };

    for (let i = 0; i < this.email.length; i += 1) {
      data.fields.EMAIL.push({ VALUE: this.email[i], VALUE_TYPE: 'WORK' });
    }

    this.checkBitrixData.textContent = 'Добавление данных в битрикс24';
    if (this.webhookInput.value === '') {
      this.checkBitrixData.textContent = 'Подключите webHook';
      return;
    }
    this.request({
      url: `${this.webhookInput.value}/crm.company.add`,
      method: 'post',
      data,
    })
      .then(() => {
        this.sended += 1;
        this.sendedElem.textContent = this.sended;
        this.checkBitrixData.textContent = `Данные успешно добавлены битрикс24`;
        this.statusData.email = false;
        this.statusData.company = false;

        if (this.auto) {
          setTimeout(() => {
            this.isAdded = true;
            pubSub.publish('isAdded');
          }, 1000);
        }
      })
      .catch((e) => {
        this.checkBitrixData.textContent = `Данные не добавлены битрикс24(Зови Женечку)`;
        reject(e);
      });
  }

  request({
    url,
    method,
    data = {},
  }) {
    return new Promise((resolve, reject) => {
      fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (response.status !== 200) {
            return Promise.reject('Ошибка ответа сервера, позови Жеку, он разрулит...');
          }
          const json = response.json();
          return json;
        })
        .then((json) => {
          resolve(json);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }


  addMatchCompany() {
    const index = this.index + 1;
    if (this.match[index]) {
      return;
    }
    this.matchCompanyContainer.classList.remove('hide');
    const html = `<span>${index}</span>`;
    this.matchCompany.insertAdjacentHTML('beforeEnd', html);

    this.match[index] = true;
  }

  onChoosMatch(e) {
    const elem = e.target.closest('span');
    if (!elem) {
      return;
    }
    if (this.matchElem === elem) {
      return;
    }
    if (this.matchElem) {
      this.matchElem.classList.remove('active');
    }
    elem.classList.add('active');
    const pos = parseInt(elem.textContent - 1, 10);
    this.matchElem = elem;
    this.goToCompany({ mode: 'goTo', pos });
    this.buttonRemoveMatch.classList.remove('hide');
  }

  matchDeselect() {
    this.buttonRemoveMatch.classList.add('hide');
    this.matchElem.classList.remove('active');
    this.matchElem = null;
  }


  removeMatchElem() {
    if (!this.matchElem || this.isPanding) {
      return;
    }
    const index = this.matchElem.textContent;
    delete this.match[index];
    this.matchElem.remove();
    this.matchElem = null;

    if (this.matchCompany.children.length === 0) {
      this.matchCompanyContainer.classList.add('hide');
    }
    this.buttonRemoveMatch.classList.add('hide');
  }


  updateData() {
    this.refreshTextElem.textContent = 'обновление...';
    this.refreshTextElem.classList.remove('hidden');
    this.refreshTextElem.classList.remove('error');
    this.getDataBase()
      .then((data) => {
        this.dataBase = data;
        this.refreshTextElem.textContent = 'данные обновлены';
        setTimeout(() => {
          this.refreshTextElem.classList.add('hidden');
        }, 2000);
      })
      .catch((e) => {
        console.warn(e);
        this.refreshTextElem.classList.add('error');
        this.refreshTextElem.textContent = 'не удалось обновить данные';
      });
  }

  searchMathesExcel() {
    const mainResault = [];
    const resultCompany = [];
    const title = this.title.toLowerCase();
    const regExpSearhCompany = new RegExp(`(^${title}[^а-яА-ЯёЁa-zA-z-]|[^а-яА-ЯёЁa-zA-z-]${title}[^а-яА-ЯёЁa-zA-z-]|[^а-яА-ЯёЁa-zA-z-]${title}$|^${title}$)`);
    this.BitrixDataBase.forEach((item) => {
      const company = item.company.toLowerCase();
      const res = company.search(regExpSearhCompany);
      if (res !== -1) {
        resultCompany.push(item);
      }
    });
    let marchNameCount = 0;
    const name = this.name.toLowerCase();
    const nameArr = name.split(' ')

    resultCompany.forEach((itemCompany) => {
      nameArr.forEach((itemName) => {
        const regExpSearhName = new RegExp(`${itemName}`);
        const comments = itemCompany.comments.toLowerCase();
        const res = comments.search(regExpSearhName);
        if (res !== -1) {
          marchNameCount += 1;
        }
      });
      if (marchNameCount > 1) {
        mainResault.push(itemCompany);
      }
      marchNameCount = 0;
    });
    return mainResault;
  }

  showMathesBitrix(data) {
    this.showMatchesContainer.classList.remove('hidden');
    const match = data;
    for (let i = 0; i < data.length; i += 1) {
      const emailObj = data[i].EMAIL;
      let emailString = '';
      for (let j = 0; j < emailObj.length; j += 1) {
        emailString += emailObj[j].VALUE + '</br>';
      }
      const html = `
        <div class="match-raw">
          <div class="full-match-title">${data[i].TITLE}</div>
          <div class="full-match-email">${emailString}</div>
          <div class="full-match-comment">${data[i].COMMENTS}</div>
        </div>
      `;
      this.fullMatch.insertAdjacentHTML('beforeEnd', html);
    }
  }


  showMathesExcel(data) {
    this.showMatchesContainer.classList.remove('hidden');
    const match = data;
    for (let i = 0; i < data.length; i += 1) {    this.fullMatchNameFilter
      let isIdMatch = false;
      for(let j = 0; j < this.fullMatchNameFilter.length; j += 1) {
        if (this.fullMatchNameFilter[j].ID === data[i].id) {
          isIdMatch = true;
          break;
        }
      }
      if (isIdMatch) {
        break;
      }
      const html = `
        <div class="match-raw">
          <div class="full-match-title">${data[i].company}</div>
          <div class="full-match-email">${data[i].email}</div>
          <div class="full-match-comment">${data[i].comments}</div>
        </div>
      `;
      this.fullMatch.insertAdjacentHTML('beforeEnd', html);
    }
  }

  getFullMatchNameFilter(data) {
    const result = [];
    let marchNameCount = 0;
    const name = this.name.toLowerCase();
    const nameArr = name.split(' ');

    data.forEach((item) => {
      nameArr.forEach((itemName) => {
        const regExpSearhName = new RegExp(`${itemName}`);
        const comments = item.COMMENTS.toLowerCase();
        const res = comments.search(regExpSearhName);
        if (res !== -1) {
          marchNameCount += 1;
        }
      });
      if (marchNameCount > 1) {
        result.push(item);
      }
      marchNameCount = 0;
    });

    return result;
  }
}

new AddCompany();
