
// helpers/handlebars.js
import exphbs from 'express-handlebars';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
export function hbsHelpers() {
    // Get the directory name of the current module file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Construct the absolute path to the layouts directory
    const layoutsDir = join(__dirname, '..', 'views', 'layouts');

    return exphbs.create({
        extname: '.hbs',
        defaultLayout: 'dashboard',
        layoutsDir: layoutsDir,
        helpers: {
            json: function(context) {
                return JSON.stringify(context);
              },
            baseUrl: function() {
                return process.env.BACKEND_URL;
            },
            returnBool: function(a,b) {
                if(a == b){
                    return true;
                }
                return false;
                
            },
            when: function(operand_1, operator, operand_2, options) {
                const operators = {
                    'eq': function(l, r) { return l == r; },
                    'noteq': function(l, r) { return l != r; },
                    'gt': function(l, r) { return Number(l) > Number(r); },
                    'or': function(l, r) { return l || r; },
                    'and': function(l, r) { return l && r; },
                    '%': function(l, r) { return (l % r) === 0; }
                };
                const result = operators[operator](operand_1, operand_2);
                

                if (result) return options.fn(this);
                else return options.inverse(this);
            },
            isAdminOrTrainer: function(userType, options) {
                if (userType === 'ADMIN' || userType === 'TRAINER') {
                    return options.fn(this); // Execute the block
                } else {
                    return options.inverse(this); // Execute the else block
                }
            },
            getFilename: function(filepath) {
    if (!filepath) return '';
    
    const fileName = filepath.split('/').pop(); // Get the filename only
    
    // Filename format: "timestamp-randomnumber-originalfilename.ext"
    // Split by '-' and remove the first two parts (timestamp and random number)
    const parts = fileName.split('-');
    
    if(parts.length < 3) {
        // If format unexpected, return full filename
        return fileName;
    }
    
    // Join back the rest parts (original filename could contain dashes)
    return parts.slice(2).join('-');
},
            formatFileSize: function(bytes) {
                if (!bytes || bytes === 0) return '0 Bytes';
                
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(Number(bytes)) / Math.log(k));
                
                return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            },
            formatDate: function(dateString) {
                if (!dateString) return '';
                
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }


        }
    });
}
