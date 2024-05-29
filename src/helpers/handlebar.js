
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
            }

        }
    });
}
