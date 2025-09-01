
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
    
    // Handle both forward slashes and backslashes
    const normalizedPath = filepath.replace(/\\/g, '/');
    
    // Get the filename from the path (last part after /)
    const fileName = normalizedPath.split('/').pop();
    
    // If the filename starts with "upload_", extract the original filename
    if(fileName && fileName.startsWith('upload_')) {
        const parts = fileName.split('_');
        if(parts.length >= 3) {
            // Remove "upload" and session ID, keep the rest as original filename
            return parts.slice(2).join('_');
        }
    }
    
    // For other formats, just return the filename as is
    return fileName;
},
            formatFileSize: function(bytes) {
                if (!bytes || bytes === 0) return '0 Bytes';
                
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(Number(bytes)) / Math.log(k));
                
                return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            },
            formatDate: function(dateString) {
                if (!dateString) return 'N/A';
                
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'N/A';
                
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Karachi' // Use Pakistan timezone for consistency
                });
            },
            eq: function(a, b) {
                return a === b;
            },
            includes: function(array, value) {
                if (!array || !Array.isArray(array)) return false;
                return array.includes(value);
            },
            toString: function(value) {
                return String(value);
            },
            isSelected: function(value1, value2) {
                return String(value1) === String(value2);
            },
            substring: function(str, start, end) {
                if (!str) return '';
                return String(str).substring(start, end);
            },
            incrementIndex: function(index) {
                return index + 1;
            },
            formatDateForInput: function(dateString) {
                if (!dateString) return '';
                
                // Parse the localized date string (e.g., "12/25/2023") and convert to YYYY-MM-DD
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return '';
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                
                return `${year}-${month}-${day}`;
            },
            endsWith: function(str, suffix) {
                if (!str || !suffix) return false;
                return String(str).toLowerCase().endsWith(String(suffix).toLowerCase());
            },
            lowercase: function(str) {
                if (!str) return '';
                return String(str).toLowerCase();
            },
            uppercase: function(str) {
                if (!str) return '';
                return String(str).toUpperCase();
            }


        }
    });
}
