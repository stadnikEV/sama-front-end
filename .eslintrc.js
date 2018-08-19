module.exports = {
  "env": {
      "browser": true,
      "es6": true
  },
  "settings": {
    "import/resolver": "webpack"
  },
  "extends": "airbnb-base",
  "parserOptions": {
      "sourceType": "module"
  },
  "parser": "babel-eslint",
  "rules": {
    "no-continue": "off",
    "prefer-destructuring": ["error",
      {
        "VariableDeclarator":
        {
          "array": false,
          "object": true
        },
      }
    ],
    "no-new": "off",
    "class-methods-use-this": ["off"],
    "strict": 0,
    "max-len": ["error", { "code": 220 }],
    "linebreak-style": [
        "error",
        "unix"
    ],
    "quotes": [
        "error",
        "single"
    ],
    "semi": [
        "error",
        "always"
    ],
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error", "log"]
      }
    ],
    "no-param-reassign": [
      "error",
      {
        "props": false
      }
    ],
    "no-underscore-dangle": [
      "error",
      {
        "allowAfterThis": true,
        "allow": ["_makeStep"]
      }
    ],
    "no-shadow": [
      "error",
      {
        "allow": ["response", "userData"]
      }
    ]
  }
}
