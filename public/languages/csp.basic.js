(()=>{var p=Object.create,o=Object.defineProperty,l=Object.getPrototypeOf,d=Object.prototype.hasOwnProperty,m=Object.getOwnPropertyNames,x=Object.getOwnPropertyDescriptor,u=r=>o(r,"__esModule",{value:!0}),g=(r,t)=>()=>(t||(t={exports:{}},r(t.exports,t)),t.exports),b=(r,t)=>{u(r);for(var e in t)o(r,e,{get:t[e],enumerable:!0})},i=(r,t,e)=>{if(u(r),t&&typeof t=="object"||typeof t=="function")for(let s of m(t))!d.call(r,s)&&s!=="default"&&o(r,s,{get:()=>t[s],enumerable:!(e=x(t,s))||e.enumerable});return r},n=r=>r&&r.__esModule?r:i(o(r!=null?p(l(r)):{},"default",{value:r,enumerable:!0}),r),a=g(y=>{i(y,n(require("monaco-editor-core")))}),f=g(k=>{b(k,{conf:()=>v,language:()=>w});var v={brackets:[],autoClosingPairs:[],surroundingPairs:[]},w={keywords:[],typeKeywords:[],tokenPostfix:".csp",operators:[],symbols:/[=><!~?:&|+\-*\/\^%]+/,escapes:/\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,tokenizer:{root:[[/child-src/,"string.quote"],[/connect-src/,"string.quote"],[/default-src/,"string.quote"],[/font-src/,"string.quote"],[/frame-src/,"string.quote"],[/img-src/,"string.quote"],[/manifest-src/,"string.quote"],[/media-src/,"string.quote"],[/object-src/,"string.quote"],[/script-src/,"string.quote"],[/style-src/,"string.quote"],[/worker-src/,"string.quote"],[/base-uri/,"string.quote"],[/plugin-types/,"string.quote"],[/sandbox/,"string.quote"],[/disown-opener/,"string.quote"],[/form-action/,"string.quote"],[/frame-ancestors/,"string.quote"],[/report-uri/,"string.quote"],[/report-to/,"string.quote"],[/upgrade-insecure-requests/,"string.quote"],[/block-all-mixed-content/,"string.quote"],[/require-sri-for/,"string.quote"],[/reflected-xss/,"string.quote"],[/referrer/,"string.quote"],[/policy-uri/,"string.quote"],[/'self'/,"string.quote"],[/'unsafe-inline'/,"string.quote"],[/'unsafe-eval'/,"string.quote"],[/'strict-dynamic'/,"string.quote"],[/'unsafe-hashed-attributes'/,"string.quote"]]}}}),c=n(a());function q(r){c.languages.register(r)}q({id:"csp",extensions:[],aliases:["CSP","csp"],loader:function(){return Promise.resolve().then(()=>n(f()))}});})();