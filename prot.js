const serialportgsm = require('serialport-gsm');
const readline = require('readline');
const fs = require('fs');
const crypto = require('crypto');
let scannedUsers = [];


const modem = serialportgsm.Modem();
const options = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  rtscts: false,
  xon: false,
  xoff: false,
  xany: false,
  autoDeleteOnReceive: true,
  enableConcatenation: true,
  incomingCallIndication: true,
  incomingSMSIndication: true,
  pin: '',
  customInitCommand: '',
  cnmiCommand: 'AT+CNMI=2,1,0,2,1',
  logger: console
};

const phoneNumber = '+639925161853'; // default number

let data = loadDataFromFile();

function saveDataToFile(data) {
  const json = JSON.stringify(data);
  const cipher = crypto.createCipher('aes-256-cbc', '$C&F)J@NcRfUjXn2r4u7x!A%D*G-KaPd');
  let encrypted = cipher.update(json, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  fs.writeFileSync('encryptedResearchDatabase.enc', encrypted);
}

function loadDataFromFile() {
  try {
    const encryptedData = fs.readFileSync('encryptedResearchDatabase.enc', 'utf8');
    const decipher = crypto.createDecipher('aes-256-cbc', '$C&F)J@NcRfUjXn2r4u7x!A%D*G-KaPd');
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    return [];
  }
}

function checkStudentId(studentId) {
  const student = data.find((d) => d.studentID === studentId);
  if (student) {
    student.loggedIn = !student.loggedIn;
    const timeStamp = new Date().toLocaleString();
    const action = student.loggedIn ? 'logged in' : 'logged out';
    scannedUsers.push({ name: student.name, section: student.section, time: timeStamp, action: action });
    fs.writeFileSync('scannedUsers.json', JSON.stringify(scannedUsers));

    saveDataToFile(data);
    return student;
  }
  return null;
}

function sendSMS(phoneNumber, message) {
  modem.sendSMS(phoneNumber, message, true, (data) => {
    console.log(data);
  });
}

modem.open('COM7', options, {});

modem.on('open', () => {
  console.log('Modem is initialized');
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getInput() {
  rl.question('', (studentID) => {
    const student = checkStudentId(studentID.trim());
    if (student) {
      const message = `${student.name} has ${student.loggedIn ? 'entered' : 'gone out of'} the school premises at ${new Date().toLocaleString()} \n\nThis is an automated message, please do not reply.`;
      sendSMS(student.phoneNumber, message);
      console.log(message);
    } else {
      console.log(`Student ID ${studentID.trim()} not found`);
    }
    getInput();
  });
}

modem.on('onNewMessage', (message) => {
  const student = checkStudentId(message.text.trim());
  if (student) {
    const message = `${student.name} has ${student.loggedIn ? 'entered' : 'gone out of'} the school premises at ${new Date().toLocaleString()} \n\nThis is an automated message, please do not reply.`;
    sendSMS(student.phoneNumber, message);
    console.log(message);
  } else {
    console.log(`Student ID ${message.text.trim()} not found`);
  }
});

getInput();