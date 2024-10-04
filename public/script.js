class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
  print() {
    let ret = "(";
    if (this.left) {
      ret += this.left.print();
    }
    ret += this.value;
    if (this.right) {
      ret += this.right.print();
    }
    return ret + ")";
  }
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

new Vue({
  el: '#app',
  data: {
    expression: getQueryParam('e') || '!(correoRecibido || mensajeNoLeido) && notificacionesActivadas',
    variables: [],
    truthTable: [],
    expressionTree: null,
    headers: [],
  },
  computed: {
    postOrderExpressions() {
      return this.postOrder(this.expressionTree);
    }
  },
  methods: {
    processExpression() {
      // Identificar las variables
      this.variables = [...new Set(this.expression.match(/[a-zA-Z]+/g))] || [];
      const tokens = this.expression.match(/([a-zA-Z_]\w*|&&|\|\||!|\(|\)|==)/g) || [];
      this.expressionTree = this.buildExpressionTree(this.shuntingYard(tokens));
      this.truthTable = this.generateTruthTable();
      this.headers = this.generateHeaders();
    },
    generateTruthTable() {
      const variables = this.variables;
      const rows = Math.pow(2, variables.length);
      const table = [];
      
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < variables.length; j++) {
          row.push(i & Math.pow(2, j) ? true : false);
        }
        row.reverse();
        
        this.postOrder(this.expressionTree).forEach(element => {
          row.push(this.evaluateExpression(row, element));
        });

        table.push(row);
      }
      
      return table.reverse();
    },
    evaluateExpression(row, exp) {
      let vars = this.variables;
      
      for (let i = 0; i < vars.length; i++) {
        exp = exp.replace(new RegExp(vars[i], 'g'), row[i]);
      }
      
      return eval(exp);
    },
    shuntingYard(tokens) {
      const outputQueue = [];
      const operatorStack = [];
      const precedence = {
        "==": 0,
        "||": 1,
        "&&": 2,
        "!": 3,
      };
      const associativity = {
        "==": "left",
        "||": "left",
        "&&": "left",
        "!": "right",
      };
      
      tokens.forEach((token) => {
        if (/[a-zA-Z_]\w*/.test(token)) {
          // Si es una variable
          outputQueue.push(token);
        } else if (token === "!" || token === "&&" || token === "||" || token === "==") {
          // Si es un operador
          while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== "(" &&
          ((associativity[token] === "left" &&
          precedence[token] <= precedence[operatorStack[operatorStack.length - 1]]) ||
          (associativity[token] === "right" &&
          precedence[token] < precedence[operatorStack[operatorStack.length - 1]]))
          ) {
            outputQueue.push(operatorStack.pop());
          }
          operatorStack.push(token);
        } else if (token === "(") {
          operatorStack.push(token);
        } else if (token === ")") {
          while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
            outputQueue.push(operatorStack.pop());
          }
          operatorStack.pop(); // Quitar el paréntesis izquierdo
        }
      });
      
      while (operatorStack.length > 0) {
        outputQueue.push(operatorStack.pop());
      }
      
      return outputQueue;
    },
    buildExpressionTree(rpnTokens) {
      const stack = [];
      
      rpnTokens.forEach((token) => {
        if (/[a-zA-Z_]\w*/.test(token)) {
          // Si es una variable
          stack.push(new TreeNode(token));
        } else if (token === "!" || token === "&&" || token === "||" || token === "==") {
          if (token === "!") {
            // Operador unario
            const operand = stack.pop();
            node = new TreeNode(token);
            node.right = operand;
            stack.push(node);
          } else {
            // Operador binario
            const right = stack.pop();
            const left = stack.pop();
            node = new TreeNode(token);
            node.left = left;
            node.right = right;
            stack.push(node);
          }
        }
      });
      
      return stack[0];
    },
    postOrder(node) {
      const ret = [];
      if (node) {
        if (node.left) {
          ret.push(this.postOrder(node.left));
        }
        if (node.right) {
          ret.push(this.postOrder(node.right));
        }
        if (node.left || node.right) {
          ret.push(node.print());
        }
      }
      return ret.flat(Infinity);
    },
    generateHeaders() {
      const headers = [];
      this.variables.forEach((variable) => {
        headers.push(variable);
      });
      this.postOrder(this.expressionTree).forEach((element) => {
        headers.push(element);
      });

      for (let i = this.variables.length; i < headers.length; i++) {
        
        for (let j = this.postOrderExpressions.length - 1; j >= 0; j--) {
          if (headers[i].replace(this.postOrderExpressions[j], String.fromCharCode(65 + j + this.variables.length)).length > 1)
            headers[i] = headers[i].replace(this.postOrderExpressions[j], String.fromCharCode(65 + j + this.variables.length));
        }
        
        for (let j = 0; j < this.variables.length; j++) {
          headers[i] = headers[i].replace(this.variables[j], String.fromCharCode(65 + j));
        }
        
      }

      return headers;
    }
  },
  mounted() {
    this.processExpression();
  }
});