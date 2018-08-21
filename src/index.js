const pubSub = window.PubSub;

class AddCompany {
  constructor() {
    const addCompanyButton = document.querySelector('.add-company');
    addCompanyButton.addEventListener('click', this.addCompany.bind(this));

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


    this.index = 0;
    this.email = null;
    this.sended = 0;
    this.isAdded = false;
    this.statusData = {
      email: false,
      company: false,
    };
    this.match = {};

    this.getDataBase()
      .then((data) => {
        this.dataBase = data;
      })
      .catch((e) => {
        console.warn(e);
      });

    this.matchCompany.addEventListener('click', this.onChoosMatch.bind(this));

    pubSub.subscribe('notValidMail', this.nextCompany.bind(this));
    pubSub.subscribe('notValidData', this.nextCompany.bind(this));
    pubSub.subscribe('dataOk', () => {
      this.addCompany();
    });
    pubSub.subscribe('isAdded', this.nextCompany.bind(this));
    pubSub.subscribe('notValidCompany', this.nextCompany.bind(this));
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

  parseEmail({ email }) {
    const emailArr = email.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g);
    return emailArr;
  }

  autoStart() {
    if (this.webhookInput.value === '') {
      this.checkBitrixData.textContent = 'Подключите webHook';
      return;
    }
    console.log(this.auto);
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
      this.goToCompany({ mode: 'goTo', pos: currentPos });
    }, delay);
  }

  showDaley(delay) {
    let delaySeconds = delay / 1000;
    this.daleyElem.textContent = delaySeconds.toFixed(1);
    this.daleyContainerElem.classList.remove('hide');
    const timerId = setInterval(() => {
      delaySeconds -= 0.1;
      if (delaySeconds < 0) {
        clearInterval(timerId);
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
      this.timer = null;
      if (!this.isPanding) {
        this.autoIndicate.classList.remove('active');
      }
      this.auto = false;
    }
  }

  goToPos() {
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
    if (!this.dataBase || this.isPanding) {
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

    this.isAdded = false;
    this.indexElem.textContent = this.index + 1;
    this.title = data.Компания;
    this.email = this.parseEmail({ email: data.Почта });
    this.name = data.ФИО;
    this.city = data.Город;
    this.industry = data.Отрасль;

    if (data.Почта === '' || data.ФИО === '') {
      this.checkBitrixData.textContent = 'Не корректные данные в Эксель';
      console.warn('Не корректные данные в Эксель');
      this.isPanding = false;
      this.email = [data.Почта];
      this.addToForm({
        title: this.title,
        email: this.email,
        comments: this.name,
        city: this.city,
        industry: this.industry,
      });
      if (this.auto) {
        setTimeout(() => {
          pubSub.publish('notValidData');
        }, 1000);
      }
      return;
    }

    this.addToForm({
      title: this.title,
      email: this.email,
      comments: this.name,
      city: this.city,
      industry: this.industry,
    });


    this.getCompanyByEmail({ email: this.email })
      .then((dataFromBitrix) => {
        return new Promise((resolve, reject) => {
          if (dataFromBitrix.result.length === 0) {
            console.log('emai ok');
            this.statusData.email = true;
            this.checkBitrixData.textContent = 'emai ok';
            resolve();
            return;
          }
          console.log(dataFromBitrix.result);
          reject('такой emai существует');
        });
      })
      .then(() => {
        return this.getCompanyByTitle({ TITLE: this.title })
      })
      .then((dataFromBitrix) => {
        return new Promise((resolve, reject) => {
          if (dataFromBitrix.result.length === 0) {
            console.log('компания ok');
            this.statusData.company = true;
            this.checkBitrixData.textContent = 'компания ok';
            resolve();
            return;
          }
          const match = dataFromBitrix.result;
          for (let i = 0; i < dataFromBitrix.result.length; i += 1) {
            const emailObj = dataFromBitrix.result[i].EMAIL;
            let emailString = '';
            console.log(emailObj[0].VALUE);
            for (let j = 0; j < emailObj.length; j += 1) {
              emailString += emailObj[j].VALUE + '</br>';
            }
            const html = `
              <div class="match-raw">
                <div class="full-match-title">${dataFromBitrix.result[i].TITLE}</div>
                <div class="full-match-email">${emailString}</div>
                <div class="full-match-comment">${dataFromBitrix.result[i].COMMENTS}</div>
              </div>
            `;
            this.fullMatch.insertAdjacentHTML('beforeEnd', html);

          }
          console.log(dataFromBitrix.result);
          this.addMatchCompany();
          reject('такая компания существует');
        });
      })
      .then(() => {
        this.isPanding = false;
        if (this.auto) {
          pubSub.publish('dataOk');
        }
      })
      .catch((e) => {
        this.isPanding = false;
        console.warn(e);
        if (typeof e === 'string') {
          this.checkBitrixData.textContent = `Ошибка:  ${e}`;
          if (e === 'такой emai существует' && this.auto) {
            setTimeout(() => {
              pubSub.publish('notValidMail');
            }, 1000);
          }
          if (e === 'такая компания существует' && this.auto) {
            setTimeout(() => {
              pubSub.publish('notValidCompany');
            }, 1000);
          }
        }
      });
  }

  addToForm({ title, email, comments, city, industry }) {
    this.inputTitle.value = title;
    this.inputComments.value = `${comments}<br><br>\n\n${this.template.value} ${city}<br>\n${industry}`;

    this.inputEmail.textContent = email[0];
    for (let i = 1; i < email.length; i += 1) {
      this.inputEmail.textContent += `\n${email[i]}`;
    }
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
    console.log(this.match);

    if (this.matchCompany.children.length === 0) {
      this.matchCompanyContainer.classList.add('hide');
    }
    this.buttonRemoveMatch.classList.add('hide');
  }
}

new AddCompany();
