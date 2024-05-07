const express = require('express');
const fileUpload = require('express-fileupload');
const shortid = require('shortid');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const appwrite = require('appwrite')
const multer = require('multer');
const validator = require('validator');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 5000;
const { v4: uuidv4 } = require('uuid');
const { Client, Account, Databases, ID, Query, Storage } = require('appwrite');

let initial_path = path.join(__dirname, "components");

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(initial_path));
// Utiliser express-fileupload comme middleware
app.use(fileUpload());

const client = new Client();

client
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('65a4565531185e4ce990');
 

const databases = new Databases(client);
const account = new Account(client);

/* LOGIN AND SIGN UP */
let userIdGlobal = '';

app.post('/sign-up', (req, res) => {
  const { email, password } = req.body;

  const promise = account.create(uuidv4(), email, password);

  promise
    .then(function (response) {
      const userId = response.$id; // Récupérer l'ID utilisateur depuis la réponse

      console.log(response); // Succès
      console.log(userId); // Afficher l'ID utilisateur

      userIdGlobal = userId; // Stocker l'ID utilisateur dans la variable globale

      res.redirect('/onboard');
    })
    .catch(function (error) {
      console.log(error); // Échec lors de la création du compte utilisateur
      res.redirect('/sign-up'); // Rediriger vers la page "/sign-up" en cas d'erreur
    });
});

app.post('/sign-in', (req, res) => {
  const { email, password } = req.body;

  const promise = account.createEmailPasswordSession(email, password);

  promise
    .then(function (response) {
      const userId = response.userId; // Récupérer l'ID utilisateur à partir de la session

      console.log(response); // Session créée avec succès
      console.log(userId); // Afficher l'ID utilisateur

      userIdGlobal = userId; // Stocker l'ID utilisateur dans la variable globale

      res.redirect('/onboard'); // Rediriger vers la page "/plan"
    })
    .catch(function (error) {
      console.log(error); // Erreur lors de l'authentification
      res.redirect('/sign-in'); // Rediriger vers la page "/login"
    });
});
/*LOGIN AND SIGN UP */





app.get('/', (req, res) => {
    res.sendFile(path.join(initial_path, "index.html"));
});
app.get('/overview', (req, res) => {
  res.sendFile(path.join(initial_path, "overview.html"));
});

app.get('/template', (req, res) => {
  res.sendFile(path.join(initial_path, "template.html"));
});

app.get('/paypal', (req, res) => {
  res.sendFile(path.join(initial_path, "paypal.html"));
});

app.get('/sign-up', (req, res) => {
  res.sendFile(path.join(initial_path, "sign-up.html"));
});

app.get('/sign-in', (req, res) => {
  res.sendFile(path.join(initial_path, "sign-in.html"));
});

app.get('/add-product', (req, res) => {
  res.sendFile(path.join(initial_path, "add-product.html"));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(initial_path, "orders.html"));
});

app.get('/place-order', (req, res) => {
  res.sendFile(path.join(initial_path, "place-order.html"));
});

/*app.get('/onboard', (req, res) => {
  res.sendFile(path.join(initial_path, "manager.html"));
});*/

/* Add product */
app.post('/add-product', (req, res) => {
  const files = req.files; // Accéder à tous les fichiers téléchargés
  

  // Vérifier si des fichiers ont été envoyés
  if (!files || Object.keys(files).length === 0) {
    return res.status(400).send("Aucun fichier n'a été uploadé.");
  }

  // Stocker les noms de fichiers uploadés
  const filenames = [];

  // Déplacer les fichiers vers le répertoire approprié
  const uploadsDir = path.join(__dirname, 'components/uploads');
  const additionalDir = path.join(__dirname, 'components/additional');

  const moveFile = (file, destination) => {
    const fileNameWithExtension = file.name; // Obtenir le nom du fichier avec son extension

    // Déplacer le fichier vers le répertoire de destination
    file.mv(destination, function(err) {
      if (err) {
        console.log(err);
        return res.status(500).send("Erreur lors du déplacement du fichier.");
      }

      // Ajouter le nom du fichier à la liste des noms de fichiers
      filenames.push(fileNameWithExtension);

      // Vérifier si tous les fichiers ont été déplacés
      if (filenames.length === Object.keys(files).length) {
        // Reste du code pour enregistrer les informations dans la base de données
        const promise = databases.createDocument(
          'selllab-database-2024',
          'users-app-products-2024',
          uuidv4(),
          {
            name: req.body.name,
            price: req.body.price.toString(),
            description: req.body.description,
            image: 'http://localhost:5000/uploads/' + filenames[0],
            size1: req.body.size,
            size2: req.body.size2,
            size3: req.body.size3,
            size4: req.body.size4,
            status: req.body.status1,
            delivery: req.body.delivery,
            store: req.body.shop,
            image1: 'http://localhost:5000/additional/' + filenames[1],
            image2: 'http://localhost:5000/additional/' + filenames[2],
            image3: 'http://localhost:5000/additional/' + filenames[3],
             
            // ...
          }
        );

        promise
          .then(function(response) {
            console.log(response); // Succès lors de la création du document
            res.redirect('/overview');
          })
          .catch(function(error) {
            console.log(error); // Échec lors de la création du document
            res.redirect('/sign-in');
          });
      }
    });
  };

  // Déplacer les fichiers téléchargés
  for (const fieldName in files) {
    const file = files[fieldName];

    if (fieldName === 'image') {
      const destination = path.join(uploadsDir, file.name);
      moveFile(file, destination);
    } else {
      const destination = path.join(additionalDir, file.name);
      moveFile(file, destination);
    }
  }
});
/* Add product */



/* Onboard */


const databaseId = 'selllab-database-2024';
const collectionId = 'visitor-2024';
/*const documentId = ID.unique();*/
let documentId; // Variable globale pour stocker l'ID du document du visiteur

app.get('/visitor', (req, res) => {
  const cookieName = 'visitorId';
  const visitorId = req.cookies[cookieName];
  const shopId = req.query.shop;

  if (visitorId) {
    console.log('Visiteur enregistré');
    res.send('Visiteur enregistré');
  } else {
    const period = {
      day: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      hour: new Date().toLocaleTimeString(),
    };

    const { day, hour } = period;
    const formattedDate = `${day} ${hour}`;

    const documentId = shortid.generate(); // Utilise shortid pour générer un ID unique

    const documentData = {
      visits: 1,
      period: formattedDate,
      sales: 0,
      orders: 0,
      shopId: shopId
    };

    databases
      .createDocument(databaseId, collectionId, documentId, documentData)
      .then(() => {
        res.cookie(cookieName, documentId, { maxAge: 365 * 24 * 60 * 60 * 1000 });
        console.log('Nouveau visiteur enregistré');
        console.log('ID du visiteur:', documentId);
        res.send('Nouveau visiteur enregistré');
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send("Erreur lors de l'enregistrement de la visite");
      });
  }
});

app.post('/place-order', (req, res) => {
  const documentId = req.cookies.visitorId; // Utilise l'ID du visiteur stocké dans le cookie

  if (!documentId) {
    res.status(500).send("ID du document du visiteur manquant");
    return;
  }

  const documentData = {
    orders: 1
  };

  databases
    .updateDocument(databaseId, collectionId, documentId, documentData)
    .then(() => {
      console.log('Commande enregistrée avec succès');
      res.send('Commande enregistrée avec succès');
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("Erreur lors de l'enregistrement de la commande");
    });
});
/*

// Route GET /overview
// Fonction yesterday
function yesterday(documents) {
  const currentDate = new Date();
  const yesterday = new Date(currentDate);
  yesterday.setDate(currentDate.getDate() - 1); // Récupère la date d'hier

  const filteredDocuments = documents.filter((document) => {
    const periodDate = new Date(document.period);
    return periodDate.toDateString() === yesterday.toDateString();
  });

  filteredDocuments.forEach((document) => {
    console.log(`Visiteur de la journée précédente : ${document.period}`);
  });

  return filteredDocuments;
}

// Fonction countWeeklyVisitors
function countWeeklyVisitors(documents, firstDay, lastDay) {
  let counter = 0;
  let startDate = null;

  documents.forEach((document) => {
    const periodDate = new Date(document.period);
    if (periodDate >= firstDay && periodDate <= lastDay) {
      counter++;
      if (startDate === null) {
        startDate = periodDate;
      }
      console.log(`Nouveau visiteur pendant la période de la semaine : ${document.period}`);
    }
  });

  const endDate = lastDay.toLocaleDateString();
  if (startDate !== null) {
    startDate = startDate.toLocaleDateString();
    console.log(`Période de la semaine : ${startDate} - ${endDate}`);
  }

  return counter;
}

// Fonction countMonthlyVisitors
function countMonthlyVisitors(documents, firstDay, lastDay) {
  let counter = 0;

  const startMonth = firstDay.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  const endMonth = lastDay.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  console.log(`Période du mois : ${startMonth} - ${endMonth}`);

  documents.forEach((document) => {
    const periodDate = new Date(document.period);
    if (periodDate >= firstDay && periodDate <= lastDay) {
      counter++;
      console.log(`Nouveau visiteur pendant la période du mois : ${document.period}`);
    }
  });

  return counter;
}

// Fonction generateHTML
// Fonction generateHTML
function generateHTML(visitorCount, visitorCounter, weeklyVisitorCounter, monthlyVisitorCounter, sales, orders)  {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link rel="stylesheet" type="text/css" href="style.css">
      <link rel="stylesheet" href="style.css">
      <link rel="stylesheet" href="home.css">
      <link rel="stylesheet" href="insight.css">
      <title>Store - insights</title>
    </head>
    <body class="dark">
  
    <div class="top-navbar-container">
        
        <div class="wrapper-container">
            <div class="middle-container">
                <ul class="container-nav">
                    <li class="nav-menu active">
                        <a href="/dashboard" class="menu">Overview</a>
                    </li>
                    <li class="nav-menu">
                        <a href="/live" class="menu">On Live</a>
                    </li>
                    <li class="nav-menu">
                        <a href="/orders" class="menu">Orders</a>
                    </li>
                    <li class="nav-menu">
                        <a href="/items" class="menu">Items</a>
                    </li>
                    
                    <li class="nav-menu">
                        <a href="/store-builder" class="menu">Builder</a>
                    </li>
                    <li class="nav-menu">
                        <a href="/add-product" class="menu">Add product</a>
                    </li>
                </ul>
                

            </div>
            <div class="right-container">
                <a href="/store">
                    <div class="user-center-store">
                        <div class="user-center-toggle">
                            
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 2c3.213 0 5.982 1.908 7.254 4.648a7.8 7.8 0 0 1-.895-.498c-.409-.258-.873-.551-1.46-.772-.669-.255-1.4-.378-2.234-.378s-1.565.123-2.234.377c-.587.223-1.051.516-1.472.781-.378.237-.703.443-1.103.594C9.41 8.921 8.926 9 8.33 9c-.595 0-1.079-.079-1.524-.248-.4-.151-.728-.358-1.106-.598-.161-.101-.34-.208-.52-.313C6.587 5.542 9.113 4 12 4zm0 16c-4.411 0-8-3.589-8-8 0-.81.123-1.59.348-2.327.094.058.185.11.283.173.411.26.876.554 1.466.776.669.255 1.399.378 2.233.378.833 0 1.564-.123 2.235-.377.587-.223 1.051-.516 1.472-.781.378-.237.703-.443 1.103-.595.445-.168.929-.247 1.525-.247s1.08.079 1.525.248c.399.15.725.356 1.114.602.409.258.873.551 1.46.773.363.138.748.229 1.153.291.049.357.083.717.083 1.086 0 4.411-3.589 8-8 8z"/><circle cx="8.5" cy="13.5" r="1.5"/><circle cx="15.5" cy="13.5" r="1.5"/></svg>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    </div>
    <div class="insight-perform-container">
    <div class="insight">
    <div class="top-insight">
       <span class="top-time">Today</span>
        <div class="store-brand">
            <img src="images/nike-logo.png" alt="">
        </div>
    </div>
    <div class="insight-income">
        <span class="income-text">Total sales</span>
        <h1><b>$${sales},00</b></h1>
    </div>
    <div class="insight-relative-box"> 
        <span class="text-revenu-period">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"><path d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"/><path d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2zM19 8l.001 12H5V8h14z"/></svg>
            <span class="period-time">Feb 24-12AM - Feb 25-11PM</span>
        </span>
       </div>
    <div class="conversion-insight-box">
        <div class="conversion-insight">
        <svg aria-hidden="true" height="13" viewBox="0 0 16 16" version="1.1" width="13" data-view-component="true" class="octicon octicon-inbox Button-visual" style="fill: white;">
            <path d="M2.8 2.06A1.75 1.75 0 0 1 4.41 1h7.18c.7 0 1.333.417 1.61 1.06l2.74 6.395c.04.093.06.194.06.295v4.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25v-4.5c0-.101.02-.202.06-.295Zm1.61.44a.25.25 0 0 0-.23.152L1.887 8H4.75a.75.75 0 0 1 .6.3L6.625 10h2.75l1.275-1.7a.75.75 0 0 1 .6-.3h2.863L11.82 2.652a.25.25 0 0 0-.23-.152Zm10.09 7h-2.875l-1.275 1.7a.75.75 0 0 1-.6.3h-3.5a.75.75 0 0 1-.6-.3L4.375 9.5H1.5v3.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25Z"></path>
        </svg>
        <span>+${orders}</span>
        Total orders
        </div>
        <div class="conversion-insight">
        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="17" style="fill: white;">
          <path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Zm-38-240h556-556Zm0 0h556l-24-120H226l-24 120Z"/></svg>
        <span>+${visitorCount}</span>
        Total visitors
        </div>
        <div class="conversion-insight">
        <svg aria-hidden="true" height="12" viewBox="0 0 16 16" version="1.1" width="12" data-view-component="true" class="octicon octicon-graph UnderlineNav-octicon d-none d-sm-inline" style="fill: white;">
            <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path>
        </svg>
        <span>+0.4%</span>
        conversion rates</div>
        </div>
</div>
    </div>
    <div class="insight">
    <div class="top-insight">
       <span class="top-time">Today</span>
        <div class="store-brand">
            <img src="images/nike-logo.png" alt="">
        </div>
    </div>
    <div class="insight-income">
        <span class="income-text">Total sales</span>
        <h1><b>$${sales},00</b></h1>
    </div>
    <div class="insight-relative-box"> 
        <span class="text-revenu-period">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"><path d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"/><path d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2zM19 8l.001 12H5V8h14z"/></svg>
            <span class="period-time">Feb 24-12AM - Feb 25-11PM</span>
        </span>
       </div>
    <div class="conversion-insight-box">
        <div class="conversion-insight">
        <svg aria-hidden="true" height="13" viewBox="0 0 16 16" version="1.1" width="13" data-view-component="true" class="octicon octicon-inbox Button-visual" style="fill: white;">
            <path d="M2.8 2.06A1.75 1.75 0 0 1 4.41 1h7.18c.7 0 1.333.417 1.61 1.06l2.74 6.395c.04.093.06.194.06.295v4.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25v-4.5c0-.101.02-.202.06-.295Zm1.61.44a.25.25 0 0 0-.23.152L1.887 8H4.75a.75.75 0 0 1 .6.3L6.625 10h2.75l1.275-1.7a.75.75 0 0 1 .6-.3h2.863L11.82 2.652a.25.25 0 0 0-.23-.152Zm10.09 7h-2.875l-1.275 1.7a.75.75 0 0 1-.6.3h-3.5a.75.75 0 0 1-.6-.3L4.375 9.5H1.5v3.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25Z"></path>
        </svg>
        <span>+${orders}</span>
        Total orders
        </div>
        <div class="conversion-insight">
        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="17" style="fill: white;">
          <path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Zm-38-240h556-556Zm0 0h556l-24-120H226l-24 120Z"/></svg>
        <span>+${visitorCounter}</span>
        Total visitors
        </div>
        <div class="conversion-insight">
        <svg aria-hidden="true" height="12" viewBox="0 0 16 16" version="1.1" width="12" data-view-component="true" class="octicon octicon-graph UnderlineNav-octicon d-none d-sm-inline" style="fill: white;">
            <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path>
        </svg>
        <span>+0.4%</span>
        conversion rates</div>
        </div>
</div>
    </div>
    <div class="insight">
    <div class="top-insight">
       <span class="top-time">Today</span>
        <div class="store-brand">
            <img src="images/nike-logo.png" alt="">
        </div>
    </div>
    <div class="insight-income">
        <span class="income-text">Total sales</span>
        <h1><b>$${sales},00</b></h1>
    </div>
    <div class="insight-relative-box"> 
        <span class="text-revenu-period">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"><path d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"/><path d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2zM19 8l.001 12H5V8h14z"/></svg>
            <span class="period-time">Feb 24-12AM - Feb 25-11PM</span>
        </span>
       </div>
    <div class="conversion-insight-box">
        <div class="conversion-insight">
        <svg aria-hidden="true" height="13" viewBox="0 0 16 16" version="1.1" width="13" data-view-component="true" class="octicon octicon-inbox Button-visual" style="fill: white;">
            <path d="M2.8 2.06A1.75 1.75 0 0 1 4.41 1h7.18c.7 0 1.333.417 1.61 1.06l2.74 6.395c.04.093.06.194.06.295v4.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25v-4.5c0-.101.02-.202.06-.295Zm1.61.44a.25.25 0 0 0-.23.152L1.887 8H4.75a.75.75 0 0 1 .6.3L6.625 10h2.75l1.275-1.7a.75.75 0 0 1 .6-.3h2.863L11.82 2.652a.25.25 0 0 0-.23-.152Zm10.09 7h-2.875l-1.275 1.7a.75.75 0 0 1-.6.3h-3.5a.75.75 0 0 1-.6-.3L4.375 9.5H1.5v3.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25Z"></path>
        </svg>
        <span>+${orders}</span>
        Total orders
        </div>
        <div class="conversion-insight">
        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="17" style="fill: white;">
          <path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Zm-38-240h556-556Zm0 0h556l-24-120H226l-24 120Z"/></svg>
        <span>+${visitorCount}</span>
        Total visitors
        </div>
        <div class="conversion-insight">
        <svg aria-hidden="true" height="12" viewBox="0 0 16 16" version="1.1" width="12" data-view-component="true" class="octicon octicon-graph UnderlineNav-octicon d-none d-sm-inline" style="fill: white;">
            <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path>
        </svg>
        <span>+0.4%</span>
        conversion rates</div>
        </div>
</div>
    </div>
    <div class="insight">
    <div class="top-insight">
       <span class="top-time">Today</span>
        <div class="store-brand">
            <img src="images/nike-logo.png" alt="">
        </div>
    </div>
    <div class="insight-income">
        <span class="income-text">Total sales</span>
        <h1><b>$${sales},00</b></h1>
    </div>
    <div class="insight-relative-box"> 
        <span class="text-revenu-period">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"><path d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"/><path d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2zM19 8l.001 12H5V8h14z"/></svg>
            <span class="period-time">Feb 24-12AM - Feb 25-11PM</span>
        </span>
       </div>
    <div class="conversion-insight-box">
        <div class="conversion-insight">
        <svg aria-hidden="true" height="13" viewBox="0 0 16 16" version="1.1" width="13" data-view-component="true" class="octicon octicon-inbox Button-visual" style="fill: white;">
            <path d="M2.8 2.06A1.75 1.75 0 0 1 4.41 1h7.18c.7 0 1.333.417 1.61 1.06l2.74 6.395c.04.093.06.194.06.295v4.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25v-4.5c0-.101.02-.202.06-.295Zm1.61.44a.25.25 0 0 0-.23.152L1.887 8H4.75a.75.75 0 0 1 .6.3L6.625 10h2.75l1.275-1.7a.75.75 0 0 1 .6-.3h2.863L11.82 2.652a.25.25 0 0 0-.23-.152Zm10.09 7h-2.875l-1.275 1.7a.75.75 0 0 1-.6.3h-3.5a.75.75 0 0 1-.6-.3L4.375 9.5H1.5v3.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25Z"></path>
        </svg>
        <span>+${orders}</span>
        Total orders
        </div>
        <div class="conversion-insight">
        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="17" style="fill: white;">
          <path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Zm-38-240h556-556Zm0 0h556l-24-120H226l-24 120Z"/></svg>
        <span>+${visitorCount}</span>
        Total visitors
        </div>
        <div class="conversion-insight">
        <svg aria-hidden="true" height="12" viewBox="0 0 16 16" version="1.1" width="12" data-view-component="true" class="octicon octicon-graph UnderlineNav-octicon d-none d-sm-inline" style="fill: white;">
            <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path>
        </svg>
        <span>+0.4%</span>
        conversion rates</div>
        </div>
</div>
    </div>
    <div class="insight">
    <div class="top-insight">
       <span class="top-time">Today</span>
        <div class="store-brand">
            <img src="images/nike-logo.png" alt="">
        </div>
    </div>
    <div class="insight-income">
        <span class="income-text">Total sales</span>
        <h1><b>$${sales},00</b></h1>
    </div>
    <div class="insight-relative-box"> 
        <span class="text-revenu-period">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"><path d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z"/><path d="M5 22h14c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-2V2h-2v2H9V2H7v2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2zM19 8l.001 12H5V8h14z"/></svg>
            <span class="period-time">Feb 24-12AM - Feb 25-11PM</span>
        </span>
       </div>
    <div class="conversion-insight-box">
        <div class="conversion-insight">
        <svg aria-hidden="true" height="13" viewBox="0 0 16 16" version="1.1" width="13" data-view-component="true" class="octicon octicon-inbox Button-visual" style="fill: white;">
            <path d="M2.8 2.06A1.75 1.75 0 0 1 4.41 1h7.18c.7 0 1.333.417 1.61 1.06l2.74 6.395c.04.093.06.194.06.295v4.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25v-4.5c0-.101.02-.202.06-.295Zm1.61.44a.25.25 0 0 0-.23.152L1.887 8H4.75a.75.75 0 0 1 .6.3L6.625 10h2.75l1.275-1.7a.75.75 0 0 1 .6-.3h2.863L11.82 2.652a.25.25 0 0 0-.23-.152Zm10.09 7h-2.875l-1.275 1.7a.75.75 0 0 1-.6.3h-3.5a.75.75 0 0 1-.6-.3L4.375 9.5H1.5v3.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25Z"></path>
        </svg>
        <span>+${orders}</span>
        Total orders
        </div>
        <div class="conversion-insight">
        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="17" style="fill: white;">
          <path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Zm-38-240h556-556Zm0 0h556l-24-120H226l-24 120Z"/></svg>
        <span>+${weeklyVisitorCounter}</span>
        Total visitors
        </div>
        <div class="conversion-insight">
        <svg aria-hidden="true" height="12" viewBox="0 0 16 16" version="1.1" width="12" data-view-component="true" class="octicon octicon-graph UnderlineNav-octicon d-none d-sm-inline" style="fill: white;">
            <path d="M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z"></path>
        </svg>
        <span>+0.4%</span>
        conversion rates</div>
        </div>
</div>
    </div>
      
    </body>
    </html>
  `;

  return html;
}

function calculateSales(documents) {
  let totalSales = 0;

  documents.forEach((document) => {
    const sales = document.sales || 0; // Assurez-vous que la propriété "sales" existe dans le document
    totalSales += sales;
  });

  return totalSales;
}
function calculateOrders(documents) {
  let totalOrders = 0;

  documents.forEach((document) => {
    const orders = document.orders || 0; // Assurez-vous que la propriété "sales" existe dans le document
    totalOrders += orders;
  });

  return totalOrders;
}

app.get('/overview', (req, res) => {
  const currentDate = new Date();
  const firstDayOfWeek = new Date(currentDate);
  const lastDayOfWeek = new Date(currentDate);
  lastDayOfWeek.setDate(currentDate.getDate() + 6); // Avance de 6 jours pour obtenir une période de 7 jours

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Premier jour du mois en cours
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Dernier jour du mois en cours

  const promise = databases.listDocuments(databaseId, collectionId);

  promise
    .then(function (response) {
      const documents = response.documents;
      const sales = calculateSales(documents); // Calcul des ventes à partir des documents
      const orders = calculateOrders(documents);

      const filteredDocumentsOfWeek = documents.filter((document) => {
        const periodDate = new Date(document.period);
        return periodDate >= firstDayOfWeek && periodDate <= lastDayOfWeek;
      });

      const filteredDocumentsOfMonth = documents.filter((document) => {
        const periodDate = new Date(document.period);
        return periodDate >= firstDayOfMonth && periodDate <= lastDayOfMonth;
      });

      const visitorCount = documents.length;

      const filteredDocumentsOfDay = yesterday(documents);
      const visitorCounterOfWeek = filteredDocumentsOfWeek.length;
      const visitorCounterOfMonth = filteredDocumentsOfMonth.length;
      const visitorCounterOfDay = filteredDocumentsOfDay.length;
      const weeklyVisitorCounter = countWeeklyVisitors(documents, firstDayOfWeek, lastDayOfWeek);
      const monthlyVisitorCounter = countMonthlyVisitors(documents, firstDayOfMonth, lastDayOfMonth);
      const html = generateHTML(visitorCount, visitorCounterOfDay, weeklyVisitorCounter, monthlyVisitorCounter, sales, orders);
      res.send(html);
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).send("Erreurlors de la récupération des documents");
    });
});*/

app.post('/onboard', (req, res) => {
  const files = req.files; // Accéder à tous les fichiers téléchargés
  const externalUUID = uuidv4();

  // Vérifier si des fichiers ont été envoyés
  if (!files || Object.keys(files).length === 0) {
    return res.status(400).send("Aucun fichier n'a été uploadé.");
  }

  // Stocker les noms de fichiers uploadés
  const filenames = [];

  // Déplacer les fichiers vers le répertoire approprié
  const uploadsDir = path.join(__dirname, 'components/logo');


  const moveFile = (file, destination) => {
    const fileNameWithExtension = file.name; // Obtenir le nom du fichier avec son extension

    // Déplacer le fichier vers le répertoire de destination
    file.mv(destination, function(err) {
      if (err) {
        console.log(err);
        return res.status(500).send("Erreur lors du déplacement du fichier.");
      }

      // Ajouter le nom du fichier à la liste des noms de fichiers
      filenames.push(fileNameWithExtension);

      // Vérifier si tous les fichiers ont été déplacés
      if (filenames.length === Object.keys(files).length) {
        // Reste du code pour enregistrer les informations dans la base de données
        const promise = databases.createDocument(
          'selllab-database-2024',
          'store-creation-2024',
          externalUUID, // Utilise l'UUID externe comme identifiant du document
          { 
          documentId: externalUUID,
          logo: 'http://localhost:5000/logo/'+ filenames[0],
          store: req.body.store,
          owner: req.body.owner,
          client: req.body.client,
          secret: req.body.secret,
          userId: userIdGlobal,
          } // Convertit formData en chaîne de caractères
        );
        
        
        

        promise
          .then(function(response) {
            console.log(response); // Succès lors de la création du document
            res.redirect('/onboard');
          })
          .catch(function(error) {
            console.log(error); // Échec lors de la création du document
            res.redirect('/sign-up');
          });
      }
    });
  };

  // Déplacer les fichiers téléchargés
  for (const fieldName in files) {
    const file = files[fieldName];

    if (fieldName === 'image') {
      const destination = path.join(uploadsDir, file.name);
      moveFile(file, destination);
    }
  }
});






app.get('/dashboard', (req, res) => {
  if (!userIdGlobal) {
    res.redirect('/sign-up');
  } else {
    const shopId = req.query.shop; // Récupère l'ID de la boutique depuis la requête
    console.log(shopId); // Vérifiez si l'ID de la boutique est correctement récupéré

    const promise1 = databases.listDocuments('selllab-database-2024', 'visitor-2024');
    const promise2 = databases.listDocuments('selllab-database-2024', 'store-creation-2024');

    Promise.all([promise1, promise2])
      .then(function (responses) {
        const visitorResponse = responses[0];
        const storeCreationResponse = responses[1];

        console.log(visitorResponse); // Affiche la réponse complète de visitor-2024 dans la console
        console.log(storeCreationResponse); // Affiche la réponse complète de store-creation-2024 dans la console

        // Filtrer les documents de visitor-2024 en fonction de l'ID de la boutique
        const filteredDocuments = visitorResponse.documents.filter((document) => {
          return document.shopId === shopId;
        });

        console.log(filteredDocuments); // Vérifiez les documents filtrés

        let totals = {
          sales: filteredDocuments[0].sales,
          orders: filteredDocuments[0].orders,
          period: filteredDocuments[0].period,
          visits: filteredDocuments[0].visits,
        };

        // Parcourir les documents restants et ajouter les valeurs au compteur
        for (let i = 1; i < filteredDocuments.length; i++) {
          const document = filteredDocuments[i];
          totals.sales += document.sales;
          totals.orders += document.orders;
          totals.period += document.period;
          totals.visits += document.visits;
        }

        // Récupérer le logo à partir de la réponse storeCreationResponse
        const store = storeCreationResponse.documents.find((doc) => doc.documentId === shopId);
        const logo = store ? store.logo : '';

        const name = storeCreationResponse.documents.find((doc) => doc.documentId === shopId);
        const shopname = name ? name.store : '';
        // Continuez le reste de votre code ici
        

        let html = `
          <!DOCTYPE html>
          <html>
          <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="style-component/app.css">
          <link rel="stylesheet" href="style-component/overview.css">
          <link rel="stylesheet" href="style-component/manager.css">
          <link rel="stylesheet" href="style-component/orders.css">
          <link rel="shortcut icon" href="favicon/favicon.svg" type="image/x-icon">
          <title>store insights</title>
          </head>
          <body class="dar">

          <div class="main-container">
          <aside class="aside-container">
          <div class="menu-box">
                      <a href="/overview" class="list-menu-box menu-active">
                          <img src="${logo}" alt="" class="overview-store-image">
                          <span>${shopname}</span>
                      </a>
                  </div>
                  <div class="menu-box">
                    <a href="/orders?shop=${shopId}" class="list-menu-box">
                          <svg aria-hidden="true" height="13" viewBox="0 0 16 16" version="1.1" width="13" data-view-component="true"><path d="M2.8 2.06A1.75 1.75 0 0 1 4.41 1h7.18c.7 0 1.333.417 1.61 1.06l2.74 6.395c.04.093.06.194.06.295v4.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25v-4.5c0-.101.02-.202.06-.295Zm1.61.44a.25.25 0 0 0-.23.152L1.887 8H4.75a.75.75 0 0 1 .6.3L6.625 10h2.75l1.275-1.7a.75.75 0 0 1 .6-.3h2.863L11.82 2.652a.25.25 0 0 0-.23-.152Zm10.09 7h-2.875l-1.275 1.7a.75.75 0 0 1-.6.3h-3.5a.75.75 0 0 1-.6-.3L4.375 9.5H1.5v3.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25Z"></path></svg>
                          <span>All orders</span>
                      </a>
                  </div>
                  <div class="menu-box">
                      <a href="/add-product?shop=${shopId}" class="list-menu-box">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M11.707 2.293A.997.997 0 0 0 11 2H6a.997.997 0 0 0-.707.293l-3 3A.996.996 0 0 0 2 6v5c0 .266.105.52.293.707l10 10a.997.997 0 0 0 1.414 0l8-8a.999.999 0 0 0 0-1.414l-10-10zM13 19.586l-9-9V6.414L6.414 4h4.172l9 9L13 19.586z"/><circle cx="8.353" cy="8.353" r="1.647"/></svg>
                          <span>Add product</span>
                      </a>
                  </div>
                  <div class="menu-box">
                      <a href="/builder?shop=${shopId}" class="list-menu-box">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"><path d="M22 5c0-1.654-1.346-3-3-3H5C3.346 2 2 3.346 2 5v2.831c0 1.053.382 2.01 1 2.746V19c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2v-8.424c.618-.735 1-1.692 1-2.746V5zm-2 0v2.831c0 1.14-.849 2.112-1.891 2.167L18 10c-1.103 0-2-.897-2-2V4h3c.552 0 1 .449 1 1zM10 4h4v4c0 1.103-.897 2-2 2s-2-.897-2-2V4zM4 5c0-.551.448-1 1-1h3v4c0 1.103-.897 2-2 2l-.109-.003C4.849 9.943 4 8.971 4 7.831V5zm6 14v-3h4v3h-4zm6 0v-3c0-1.103-.897-2-2-2h-4c-1.103 0-2 .897-2 2v3H5v-7.131c.254.067.517.111.787.125A3.988 3.988 0 0 0 9 10.643c.733.832 1.807 1.357 3 1.357s2.267-.525 3-1.357a3.988 3.988 0 0 0 3.213 1.351c.271-.014.533-.058.787-.125V19h-3z"/></svg>
                          <span>Builder store</span>
                      </a>
                  </div>
              <div class="menu-box">
                  <a href="/onboard" class="list-menu-box active">
                      <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="17"><path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Zm-38-240h556-556Zm0 0h556l-24-120H226l-24 120Z"/></svg>
                      <span>All stores</span>
                  </a>
              </div>
              <div class="menu-box">
                  <a href="/account-settings" class="list-menu-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 2c3.213 0 5.982 1.908 7.254 4.648a7.8 7.8 0 0 1-.895-.498c-.409-.258-.873-.551-1.46-.772-.669-.255-1.4-.378-2.234-.378s-1.565.123-2.234.377c-.587.223-1.051.516-1.472.781-.378.237-.703.443-1.103.594C9.41 8.921 8.926 9 8.33 9c-.595 0-1.079-.079-1.524-.248-.4-.151-.728-.358-1.106-.598-.161-.101-.34-.208-.52-.313C6.587 5.542 9.113 4 12 4zm0 16c-4.411 0-8-3.589-8-8 0-.81.123-1.59.348-2.327.094.058.185.11.283.173.411.26.876.554 1.466.776.669.255 1.399.378 2.233.378.833 0 1.564-.123 2.235-.377.587-.223 1.051-.516 1.472-.781.378-.237.703-.443 1.103-.595.445-.168.929-.247 1.525-.247s1.08.079 1.525.248c.399.15.725.356 1.114.602.409.258.873.551 1.46.773.363.138.748.229 1.153.291.049.357.083.717.083 1.086 0 4.411-3.589 8-8 8z"/><circle cx="8.5" cy="13.5" r="1.5"/><circle cx="15.5" cy="13.5" r="1.5"/></svg>
                      <span>Account settings</span>
                  </a>
              </div>
              <div class="menu-box">
                  <a href="/feedback" class="list-menu-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"><path d="M16 2H8C4.691 2 2 4.691 2 8v13a1 1 0 0 0 1 1h13c3.309 0 6-2.691 6-6V8c0-3.309-2.691-6-6-6zm4 14c0 2.206-1.794 4-4 4H4V8c0-2.206 1.794-4 4-4h8c2.206 0 4 1.794 4 4v8z"/><path d="M7 9h10v2H7zm0 4h7v2H7z"/></svg>
                      <span>Give us feedback</span>
                  </a>
              </div>
              <div class="menu-box">
                  <a href="/selllab-settings" class="list-menu-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"><path d="M12.01 2.25c.74 0 1.47.1 2.18.25.32.07.55.33.59.65l.17 1.53a1.38 1.38 0 001.92 1.11l1.4-.61c.3-.13.64-.06.85.17a9.8 9.8 0 012.2 3.8c.1.3 0 .63-.26.82l-1.24.92a1.38 1.38 0 000 2.22l1.24.92c.26.19.36.52.27.82a9.8 9.8 0 01-2.2 3.8.75.75 0 01-.85.17l-1.4-.62a1.38 1.38 0 00-1.93 1.12l-.17 1.52a.75.75 0 01-.58.65 9.52 9.52 0 01-4.4 0 .75.75 0 01-.57-.65l-.17-1.52a1.38 1.38 0 00-1.93-1.11l-1.4.62a.75.75 0 01-.85-.18 9.8 9.8 0 01-2.2-3.8c-.1-.3 0-.63.27-.82l1.24-.92a1.38 1.38 0 000-2.22l-1.24-.92a.75.75 0 01-.28-.82 9.8 9.8 0 012.2-3.8c.23-.23.57-.3.86-.17l1.4.62c.4.17.86.15 1.25-.08.38-.22.63-.6.68-1.04l.17-1.53a.75.75 0 01.58-.65c.72-.16 1.45-.24 2.2-.25zm0 1.5c-.45 0-.9.04-1.35.12l-.11.97a2.89 2.89 0 01-4.02 2.33l-.9-.4A8.3 8.3 0 004.28 9.1l.8.59a2.88 2.88 0 010 4.64l-.8.59a8.3 8.3 0 001.35 2.32l.9-.4a2.88 2.88 0 014.02 2.32l.1.99c.9.15 1.8.15 2.7 0l.1-.99a2.88 2.88 0 014.02-2.32l.9.4a8.3 8.3 0 001.36-2.32l-.8-.59a2.88 2.88 0 010-4.64l.8-.59a8.3 8.3 0 00-1.35-2.32l-.9.4a2.88 2.88 0 01-4.02-2.32l-.11-.98c-.45-.08-.9-.11-1.34-.12zM12 8.25a3.75 3.75 0 110 7.5 3.75 3.75 0 010-7.5zm0 1.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"></path></svg>
                      <span>Selllab settings</span>
                  </a>
              </div>
          </aside>
          <div class="main-container-section">
              <div class="section-overview">
                  <div class="overview-section-container">
                      <div class="overview-container-top">
                          <h1 class="text-top-section">
                              Overview
                          </h1>
                          <div class="dropdown-overview"><span>Today - Feb 22 2024 12pm</span></div>
                      </div>
                      <div class="overview-container">`;
                      
                        html += `
                          <div class="overview">
                              <div class="top-overview"><span>Total sales</span></div>
                              <div class="data-overview">
                                  <h1>$${totals.sales}.00</h1>
                              </div>
                              <div class="top-products-selled">
                                  <div class="top-product">
                                      <div class="relative-image">
                                      <span class="relative-sup-stars">✨</span>
                                      <img src="products/03ed78770aaaff31188fbc04ae3f71f8.jpg" alt="" class="top-product-image">
                                      <span class="relative-sub-stars">✨</span>
                                      </div>
                                      <span class="selled">$115.15</span>
                                      <button class="onboard-button"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#777" class="bi bi-three-dots-vertical" viewBox="0 0 16 16"> <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/></svg></button>
                                  
                                  </div>
                              </div>
                          </div>
                          <div class="overview">
                              <div class="top-overview"><span>Total visitors</span></div>
                              <div class="data-overview">
                                  <h1>${totals.visits}</h1>
                              </div>
                          </div>
                          <div class="overview">
                              <div class="top-overview"><span>Total customers</span></div>
                              <div class="data-overview">
                                  <h1>${totals.orders}</h1>
                              </div>
                          </div>`;
                        
                        
                          html += `
                      </div>
                  </div>
                 
              </div>
              
          </div>
      </div>
            
          </body>
          </html>`;

        // Envoyer le code HTML généré à la vue pour l'affichage
        res.send(html);
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).send("Une erreur s'est produite");
      });
  }
});

app.get('/items', (req, res) => {
  if (!userIdGlobal) {
    res.redirect('/sign-up');
  } else {
    const shopId = req.query.shop; // Récupère l'ID de la boutique depuis la requête
    console.log(shopId); // Vérifiez si l'ID de la boutique est correctement récupéré

    const promise1 = databases.listDocuments('selllab-database-2024', 'users-app-products-2024');
    const promise2 = databases.listDocuments('selllab-database-2024', 'store-creation-2024');

    Promise.all([promise1, promise2])
      .then(function (responses) {
        const userProductsResponse = responses[0];
        const storeCreationResponse = responses[1];

        console.log(userProductsResponse); // Affiche la réponse complète de user-products-2024 dans la console
        console.log(storeCreationResponse); // Affiche la réponse complète de store-creation-2024 dans la console

        // Filtrer les documents de user-products-2024 en fonction de l'ID utilisateur et de l'ID de la boutique
        const filteredDocuments = userProductsResponse.documents.filter((document) => {
          return document.store === shopId;
        });

        console.log(filteredDocuments); // Vérifiez les documents filtrés

        // Recherchez le document correspondant dans store-creation-2024
        const storeCreationDocument = storeCreationResponse.documents.find((document) => {
          return document.documentId === shopId;
        });

        console.log(storeCreationDocument); // Vérifiez le document trouvé

        // Vérifiez si le documentId existe et ajoutez-le dans un span
        let stepHTML = '';
        if (storeCreationDocument && storeCreationDocument.documentId) {
          stepHTML = `${storeCreationDocument.documentId}`;
        }

        const html = generateHTML(filteredDocuments, stepHTML); // Ajout de stepHTML comme argument

        // Envoyer le code HTML généré à la vue pour l'affichage
        res.send(html);
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).send("Une erreur s'est produite");
      });
  }
});

function generateHTML(documents, step) {
  let html = '<html>';
  html += '<head>';
  html += '<link rel="stylesheet" href="style-component/app.css">';
    html += '<link rel="stylesheet" href="style-component/add-product.css">';
    html += '<link rel="stylesheet" href="style-component/overview.css">';
    html += '<link rel="stylesheet" href="style-component/manager.css">';
    html += '<link rel="shortcut icon" href="favicon/favicon.svg" type="image/x-icon">';
  html += '<title>Items</title>';
  // Ajoutez ici les balises <meta>, <link>, <style>, etc., selon vos besoins
  html += '</head>';
  html += '<body>';

  html += '<div class="main-container">';
  html += '<aside class="aside-container">';
  html += '<div class="menu-box">';
  html += `<a href="/dashboard?shop=${encodeURIComponent(step)}" class="list-menu-box">`;
  html += '<img src="logo/nike-logo-removebg-preview (1).png" alt="" class="overview-store-image">';
  html += '<span>Sparkle inc.</span>';
  html += '</a>';
  html += '</div>';

  html += '<div class="menu-box">';
  html += '<a href="/orders" class="list-menu-box">';
  html += '<svg aria-hidden="true" height="13" viewBox="0 0 16 16" version="1.1" width="13" data-view-component="true"><path d="M2.8 2.06A1.75 1.75 0 0 1 4.41 1h7.18c.7 0 1.333.417 1.61 1.06l2.74 6.395c.04.093.06.194.06.295v4.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25v-4.5c0-.101.02-.202.06-.295Zm1.61.44a.25.25 0 0 0-.23.152L1.887 8H4.75a.75.75 0 0 1 .6.3L6.625 10h2.75l1.275-1.7a.75.75 0 0 1 .6-.3h2.863L11.82 2.652a.25.25 0 0 0-.23-.152Zm10.09 7h-2.875l-1.275 1.7a.75.75 0 0 1-.6.3h-3.5a.75.75 0 0 1-.6-.3L4.375 9.5H1.5v3.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25Z"></path></svg>';
  html += '<span>All orders</span>';
  html += '</a>';
  html += '</div>';

  html += '<div class="menu-box">';
  html += '<a href="/add-product" class="list-menu-box">';
  html += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M11.707 2.293A.997.997 0 0 0 11 2H6a.997.997 0 0 0-.707.293l-3 3A.996.996 0 0 0 2 6v5c0 .266.105.52.293.707l10 10a.997.997 0 0 0 1.414 0l8-8a.999.999 0 0 0 0-1.414l-10-10zM13 19.586l-9-9V6.414L6.414 4h4.172l9 9L13 19.586z"/><circle cx="8.353" cy="8.353" r="1.647"/></svg>';
  html += '<span>Add product</span>';
  html += '</a>';
  html += '</div>';

  html += '</aside>';
  html += '<div class="main-container-section">';
  
  html += '<table class="table-store">';
  html += '<thead>';
    html += '<tr>';
    html += '<td>Stores</td>';
    html += '<td>Customers</td>';
    html += '<td>Sales</td>';
    html += '<td>Avg.</td>';
    html += '</tr>';
    html += '</thead>';
  html += '<tbody>';
  documents.forEach((document) => {
    

    html += '<tr>';
    html += `<td class="store-on-top">`;
    html += `<img src="${document.image}"  alt="" class="store-top-brand">`;
    html += `<span class="store-name">${document.name}</span>`;
    html += `<td>${document.price}</td>`;
    html += `<td>${step}</td>`;
    
    // Formater la date
    const createdAt = new Date(document.$createdAt);
    const formattedDate = createdAt.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });

    html += `<td><a href="/dashboard?shop=${encodeURIComponent(step)}" class="store-overview-link">dashboard</a></td>`;
    html += '<td>'+ formattedDate +'</td>'; // Utiliser le formatage de date ici
    html += '</tr>';
  });
  html += '</tbody>';
  html += '</table>';
  
  html += '</div>';
  html += '</div>';

  html += '</body>';
  html += '</html>';

  return html;
}

; // Initialise la variable selectedTheme avec une valeur par défaut vide







function generateDocumentFilterHtml(documents) {
  let html = '';
  html += '<html lang="en">';
    html += '<meta charset="UTF-8">';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    html += '<link rel="stylesheet" href="style-component/app.css">';
    html += '<link rel="stylesheet" href="style-component/add-product.css">';
    html += '<link rel="stylesheet" href="style-component/manager.css">';
    html += '<link rel="shortcut icon" href="favicon/favicon.svg" type="image/x-icon">';
    html += '<title>Store manager</title>';
    html += '</head>';
    html += '<body class="dar">';
    html += '<div class="main-container">';
    html += '<aside class="aside-container">';
    html += '<div class="container-menu-box">';
    html += '<div class="menu-box">';
    html += '<a href="/onboard" class="list-menu-box active">';
    html += '<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="17"><path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Zm-38-240h556-556Zm0 0h556l-24-120H226l-24 120Z"/></svg>';
    html += '<span>All stores</span>';
    html += '</a>';
    html += '<div class="container-button-store-creation">';
    html += '<button class="create-store-open-container" id="toggle-button">';
    html += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">';
    html += '<path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>';
    html += '</svg>';
    html += 'Add a new store';
    html += '</button>';
    html += '</div>';
    html += '<div class="store-created-box-list">';
    html += '<div class="all-stores-created-box">';
    documents.forEach(function (document) {
      html += '<a href="/visitor?shop=' + encodeURIComponent(document.documentId) + '" class="store-overview-link">';
      html += '<div class="stores-created">';
      html += '<div class="store-brand">';
      html += '<img src="' + document.logo + '" alt="" class="logo-store-created">';
      html += '</div>';
      html += '<p class="store-name">' + document.store + '</p>';
      html += '<div class="container-action-button">';
      html += '<button class="action-button"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="#777" class="bi bi-three-dots-vertical" viewBox="0 0 16 16"> <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/></svg></button>';
      html += '<div class="container-action hide">';
      html += '<div class="add-custom-domain-box">';
      html += '<button class="add-custom-domain-button">';
      html += 'Add a custom domain';
      html += '</button>';
      html += '<button class="delete-store-button">';
      html += 'Delete store';
      html += '</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
      html += '</a>';
  });
  
  // Condition "else" après la boucle forEach
  if (documents && documents.length > 0) {
      // Code à exécuter lorsque la condition est vraie
  } else {
      // Code à exécuter lorsque la condition est fausse
      html += '<div class="alert-text"><span>Add a store to start</span></div>';
  }

    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="menu-box">';
    html += '<a href="/account" class="list-menu-box">';
    html += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 2c3.213 0 5.982 1.908 7.254 4.648a7.8 7.8 0 0 1-.895-.498c-.409-.258-.873-.551-1.46-.772-.669-.255-1.4-.378-2.234-.378s-1.565.123-2.234.377c-.587.223-1.051.516-1.472.781-.378.237-.703.443-1.103.594C9.41 8.921 8.926 9 8.33 9c-.595 0-1.079-.079-1.524-.248-.4-.151-.728-.358-1.106-.598-.161-.101-.34-.208-.52-.313C6.587 5.542 9.113 4 12 4zm0 16c-4.411 0-8-3.589-8-8 0-.81.123-1.59.348-2.327.094.058.185.11.283.173.411.26.876.554 1.466.776.669.255 1.399.378 2.233.378.833 0 1.564-.123 2.235-.377.587-.223 1.051-.516 1.472-.781.378-.237.703-.443 1.103-.595.445-.168.929-.247 1.525-.247s1.08.079 1.525.248c.399.15.725.356 1.114.602.409.258.873.551 1.46.773.363.138.748.229 1.153.291.049.357.083.717.083 1.086 0 4.411-3.589 8-8 8z"/><circle cx="8.5" cy="13.5" r="1.5"/><circle cx="15.5" cy="13.5" r="1.5"/></svg>';
    html += '<span>Account settings</span>';
    html += '</a>';
    html += '</div>';
    html += '<div class="menu-box">';
    html += '<a href="/feedback" class="list-menu-box">';
    html += '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 2c3.213 0 5.982 1.908 7.254 4.648a7.8 7.8 0 0 1-.895-.498c-.409-.258-.873-.551-1.46-.772-.669-.255-1.4-.378-2.234-.378s-1.565.123-2.234.377c-.587.223-1.051.516-1.472.781-.378.237-.703.443-1.103.594C9.41 8.921 8.926 9 8.33 9c-.595 0-1.079-.079-1.524-.248-.4-.151-.728-.358-1.106-.598-.161-.101-.34-.208-.52-.313C6.587 5.542 9.113 4 12 4zm0 16c-4.411 0-8-3.589-8-8 0-.81.123-1.59.348-2.327.094.058.185.11.283.173.411.26.876.554 1.466.776.669.255 1.399.378 2.233.378.833 0 1.564-.123 2.235-.377.587-.223 1.051-.516 1.472-.781.378-.237.703-.443 1.103-.595.445-.168.929-.247 1.525-.247s1.08.079 1.525.248c.399.15.725.356 1.114.602.409.258.873.551 1.46.773.363.138.748.229 1.153.291.049.357.083.717.083 1.086 0 4.411-3.589 8-8 8z"/><circle cx="8.5" cy="13.5" r="1.5"/><circle cx="15.5" cy="13.5" r="1.5"/></svg>';
    html += '<span>Give us feedback</span>';
    html += '</a>';
    html += '</div>';
    html += '<div class="menu-box">';
    html += '<a href="/selllab-settings" class="list-menu-box">';
    html += '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path d="M12.01 2.25c.74 0 1.47.1 2.18.25.32.07.55.33.59.65l.17 1.53a1.38 1.38 0 001.92 1.11l1.4-.61c.3-.13.64-.06.85.17a9.8 9.8 0 012.2 3.8c.1.3 0 .63-.26.82l-1.24.92a1.38 1.38 0 000 2.22l1.24.92c.26.19.36.52.27.82a9.8 9.8 0 01-2.2 3.8.75.75 0 01-.85.17l-1.4-.62a1.38 1.38 0 00-1.93 1.12l-.17 1.52a.75.75 0 01-.58.65 9.52 9.52 0 01-4.4 0 .75.75 0 01-.57-.65l-.17-1.52a1.38 1.38 0 00-1.93-1.11l-1.4.62a.75.75 0 01-.85-.18 9.8 9.8 0 01-2.2-3.8c-.1-.3 0-.63.27-.82l1.24-.92a1.38 1.38 0 000-2.22l-1.24-.92a.75.75 0 01-.28-.82 9.8 9.8 0 012.2-3.8c.23-.23.57-.3.86-.17l1.4.62c.4.17.86.15 1.25-.08.38-.22.63-.6.68-1.04l.17-1.53a.75.75 0 01.58-.65c.72-.16 1.45-.24 2.2-.25zm0 1.5c-.45 0-.9.04-1.35.12l-.11.97a2.89 2.89 0 01-4.02 2.33l-.9-.4A8.3 8.3 0 004.28 9.1l.8.59a2.88 2.88 0 010 4.64l-.8.59a8.3 8.3 0 001.35 2.32l.9-.4a2.88 2.88 0 014.02 2.32l.1.99c.9.15 1.8.15 2.7 0l.1-.99a2.88 2.88 0 014.02-2.32l.9.4a8.3 8.3 0 001.36-2.32l-.8-.59a2.88 2.88 0 010-4.64l.8-.59a8.3 8.3 0 00-1.35-2.32l-.9.4a2.88 2.88 0 01-4.02-2.32l-.11-.98c-.45-.08-.9-.11-1.34-.12zM12 8.25a3.75 3.75 0 110 7.5 3.75 3.75 0 010-7.5zm0 1.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"></path></svg>';
    html += '<span>Selllab settings</span>';
    html += '</a>';
    html += '</div>';
    html += '</aside>';
    html += '<div class="main-container-section">';
    html += '<div class="onboard-container-section">';
    html += '<h1 class="onboard-text">Onboard</h1>';
    html += '<table class="table-store">';
    html += '<thead>';
    html += '<tr>';
    html += '<td>Stores</td>';
    html += '<td>Customers</td>';
    html += '<td>Sales</td>';
    html += '<td>Avg.</td>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';
    if (documents && documents.length > 0) {
      documents.forEach(function (document) {
        html += '<tr>';
        html += '<td class="store-on-top">';
        html += '<img src="'+ document.logo +'" alt="" class="store-top-brand">';
        html += '<span class="store-name">'+ document.store +'</span>';
        html += '</td>';
        
        // Formater la date
        const createdAt = new Date(document.$createdAt);
        const formattedDate = createdAt.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        });
    
        html += '<td><a href="/dashboard?shop=' + encodeURIComponent(document.documentId) + '" class="store-overview-link">dashboard</td>';
        html += '<td>'+ formattedDate +'</td>'; // Utiliser le formatage de date ici
        html += '<td><a href="/builder?shop=' + encodeURIComponent(document.documentId) + '" class="store-overview-link">Choose theme</td>';
        html += '</tr>';
      });
    }
    html += '</tbody>';
    html += '</table>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '<aside class="create-store-container hide">';
    html += '<form method="post"  class="container-store-creation-details" enctype="multipart/form-data">';
    html += '<div class="img-area select-image">';
    html += '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 24 24"><path d="M3 20h18a1 1 0 0 0 .864-1.504l-7-12c-.359-.615-1.369-.613-1.729 0L9.866 12.1l-1.02-1.632A.998.998 0 0 0 8 10h-.001a1 1 0 0 0-.847.47l-5 8A1 1 0 0 0 3 20zM14 8.985 19.259 18h-5.704l-2.486-3.987L14 8.985zm-5.999 3.9L11.197 18H4.805l3.196-5.115zM6 8c1.654 0 3-1.346 3-3S7.654 2 6 2 3 3.346 3 5s1.346 3 3 3zm0-4a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>';
    html += '<span>Upload Logo Store</span>';
    html += '</div>';
    html += '<input type="file" id="file"  name="image" accept="image/*"  style="display: none;">';
    html += '<div class="input-group">';
    html += '<input type="text" name="store" required>';
    html += '<label for="name">Store name</label>';
    html += '</div>';
    html += '<div class="input-group">';
    html += '<input type="text" name="domain" required>';
    html += '<label for="name">Store domain</label>';
    html += '</div>';
    html += '<div class="input-group">';
    html += '<input type="text" name="domain" required>';
    html += '<label for="name">Store domain</label>';
    html += '</div>';
    html += '<div class="input-group">';
    html += '<input type="text" name="client" required>';
    html += '<label for="name">Paypal_client</label>';
    html += '</div>';
    html += '<div class="input-group">';
    html += '<input type="text" name="secret" required>';
    html += '<label for="name">Paypal_secret</label>';
    html += '</div>';
    html += '<button type="submit"  class="branded-button">Create store</button>';
    html += `
    <div class="theme-selection">
    
      
      <!-- Ajoutez des boutons supplémentaires pour les autres thèmes -->
    </form>
  </div>
    `
    html += '</form>';
    html += '</aside>';
    html += '<script src="upload/upload.js"></script>';
    html += '<script src="upload/toggle.js"></script>';
    html += '</body>';
    html += '</html>';

  return html;
  }

// Définissez les routes


app.get('/onboard', function (req, res) {
  const selectedTheme = req.query.theme || 'default'; // Récupérer le thème choisi depuis les paramètres de requête
  // Remplacez getUserId() par la méthode appropriée pour obtenir l'ID utilisateur

  if (!userIdGlobal) {
    res.redirect('/sign-up');
  } else {
    const promise = databases.listDocuments('selllab-database-2024', 'store-creation-2024');
    promise
      .then(function (response) {
        console.log(response); // Affiche la réponse complète dans la console

        // Filtrer les documents en fonction de l'ID utilisateur
        const filteredDocuments = response.documents.filter((document) => document.userId === userIdGlobal);

        // Générer le code HTML correspondant aux documents filtrés et au thème sélectionné
        const html = generateOnboardHtml(selectedTheme, filteredDocuments);

        // Envoyer le code HTML généré à la vue pour l'affichage
        res.send(html);
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).send("Une erreur s'est produite");
      });
  }
});

// Définissez la fonction generateOnboardHtml
// Définissez la fonction generateOnboardHtml
// Définissez la fonction generateOnboardHtml
// Définissez la fonction generateOnboardHtml
function generateOnboardHtml(selectedTheme, filteredDocuments) {
  

  const documentFilterHtml = generateDocumentFilterHtml(filteredDocuments);

  let html = `
    
        
        ${documentFilterHtml}
      
  `;

  return html;
}
// Définissez la fonction generateStoreHtml
// Définissez la fonction generateStoreHtml



/*function redirectToStore(theme) {
  const storeHtml = generateStoreHtml(theme);
  const encodedHtml = encodeURIComponent(storeHtml);
  window.location.href = '/store?html=' + encodedHtml;
}*/






let selectedTheme = ''; // Thème par défaut
app.get('/builder', (req, res) => {
  const { shop } = req.query; // Récupérer l'ID de la boutique depuis les paramètres de requête
  const builderPage = `
    <h1>Sélectionnez un thème :</h1>
    <button onclick="selectTheme('theme1')"><img src="templat.png" alt="" class="logo"></button>
    <button onclick="selectTheme('theme2')">Thème 2</button>
    <button onclick="selectTheme('theme3')">Thème 3</button>
    <script>
      function selectTheme(theme) {
        document.cookie = '${shop}_selectedTheme=' + theme;
        window.location.href = '/store?shop=${shop}';
      }
    </script>
    <style>
    button{
      background: none;
      border: none;
  }
  button img{
      width: 100%;
      height: 300px;
      object-fit: cover;
  }
  </style>
  `;

  res.send(builderPage);
});

app.get('/store', (req, res) => {
  if (!userIdGlobal) {
    res.redirect('/sign-up');
  } else {
    const shopId = req.query.shop; // Récupère l'ID de la boutique depuis la requête
    console.log(shopId); // Vérifiez si l'ID de la boutique est correctement récupéré

    const promise1 = databases.listDocuments('selllab-database-2024', 'users-app-products-2024');
    const promise2 = databases.listDocuments('selllab-database-2024', 'store-creation-2024');

    Promise.all([promise1, promise2])
      .then(function (responses) {
        const userProductsResponse = responses[0];
        const storeCreationResponse = responses[1];

        console.log(userProductsResponse); // Affiche la réponse complète de user-products-2024 dans la console
        console.log(storeCreationResponse); // Affiche la réponse complète de store-creation-2024 dans la console

        // Filtrer les documents de user-products-2024 en fonction de l'ID utilisateur et de l'ID de la boutique
        const filteredDocuments = userProductsResponse.documents.filter((document) => {
          return document.store === shopId;
        });

        console.log(filteredDocuments); // Vérifiez les documents filtrés

        // Recherchez le document correspondant dans store-creation-2024
        const storeCreationDocument = storeCreationResponse.documents.find((document) => {
          return document.documentId === shopId;
        });

        console.log(storeCreationDocument); // Vérifiez le document trouvé


        const { shop } = req.query; // Récupérer l'ID de la boutique depuis les paramètres de requête
        const selectedThemeCookie = `${shop}_selectedTheme`;
        const selectedTheme = req.cookies[selectedThemeCookie] || 'theme1'; // Thème par défaut

        let storeContent = '';

        switch (selectedTheme) {
          case 'theme1':
            storeContent = `
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="style-component/app.css">
                <link rel="stylesheet" href="style-component/template.css">
                <link rel="shortcut icon" href="logo/nike-logo-removebg-preview (1).png" type="image/x-icon">
                <title>Nike store</title>
            </head>
            <body>
                <header>
                    <nav>
                        <div class="first">
                            <a href=""><img src="logo/nike-logo-removebg-preview (1).png" alt="" class="logo"></a>
                        </div>
                        <div class="last">
                            <span class="search">
                                <svg aria-hidden="true" class="pre-nav-design-icon" focusable="false" viewBox="0 0 24 24" role="img" width="20px" height="20px" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M13.962 16.296a6.716 6.716 0 01-3.462.954 6.728 6.728 0 01-4.773-1.977A6.728 6.728 0 013.75 10.5c0-1.864.755-3.551 1.977-4.773A6.728 6.728 0 0110.5 3.75c1.864 0 3.551.755 4.773 1.977A6.728 6.728 0 0117.25 10.5a6.726 6.726 0 01-.921 3.407c-.517.882-.434 1.988.289 2.711l3.853 3.853"></path></svg>
                                <input type="text" placeholder="Rechercher...">
                            </span>
                            <span>
                                <svg aria-hidden="true" class="pre-nav-design-icon" focusable="false" viewBox="0 0 24 24" role="img" width="20px" height="20px" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M8.25 8.25V6a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 110 4.5H3.75v8.25a3.75 3.75 0 003.75 3.75h9a3.75 3.75 0 003.75-3.75V8.25H17.5"></path></svg>
                            </span>
                            <span>
                                <svg aria-hidden="true" class="pre-nav-design-icon" focusable="false" viewBox="0 0 24 24" role="img" width="20px" height="20px" fill="none" data-var="glyph" style="display: inline-block;"><path fill="currentColor" d="M12 3a4.5 4.5 0 00-4.5 4.5H9a3 3 0 013-3V3zM7.5 7.5A4.5 4.5 0 0012 12v-1.5a3 3 0 01-3-3H7.5zM12 12a4.5 4.5 0 004.5-4.5H15a3 3 0 01-3 3V12zm4.5-4.5A4.5 4.5 0 0012 3v1.5a3 3 0 013 3h1.5zM4.5 21v-3H3v3h1.5zm0-3a3 3 0 013-3v-1.5A4.5 4.5 0 003 18h1.5zm3-3h9v-1.5h-9V15zm9 0a3 3 0 013 3H21a4.5 4.5 0 00-4.5-4.5V15zm3 3v3H21v-3h-1.5z"></path></svg>
                            </span>
                            <span>
                                <svg aria-hidden="true" class="pre-nav-design-icon" focusable="false" viewBox="0 0 24 24" role="img" width="20px" height="20px" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M21 5.25H3M21 12H3m18 6.75H3"></path></svg>
                            </span>
                        </div>
                    </nav>
                </header>
                <div class="banner">
                    <h1>
                        Nike Cortez
                    </h1>
                    <a href="#shop" class="button-shop">Start shopping</a>
                </div>
                <div class="product-container">
                  <div class="product">
                  ${filteredDocuments.map((document) => {
                    const image = document.image; // Récupérer l'image du document
                    const name = document.name;
                    const price = document.price;
                    
            
                    return `
                      <img src="${image}" alt="">
                      <span class="name">${name}</span>
                      <span class="price">$${price},00</span>
            
                      
                    `;
                  }).join('')}
                  </div>
                </div>
                <footer>
                    <span>Powered by selllab.</span>
                    <span>© copyright 2024 selllab.</span>
                </footer>
                
                  
                   
              </body>`;
            break;
          case 'theme2':
            storeContent = '<h1>Contenu du thème 2</h1>';
            break;
          case 'theme3':
            storeContent = '<h1>Contenu du thème 3</h1>';
            break;
          default:
            storeContent = '<h1>Contenu par défaut</h1>';
        }

        const storePage = `
          <h1>Page Store</h1>
          ${storeContent}
        `;

        res.send(storePage);
      });
  }
});


app.listen(port, () => {
    console.log(`le serveur est démarrer au port ${port} `)
})
