from fastapi import FastAPI

app = FastAPI(title="product-service", version="1.0.0")

cars = [
    {"id": "car-001", "city": "Paris", "airport": "Charles de Gaulle (CDG)", "model": "Peugeot 208", "dailyPrice": 52},
    {"id": "car-002", "city": "Paris", "airport": "Orly (ORY)", "model": "Renault Clio", "dailyPrice": 49},
    {"id": "car-003", "city": "Lyon", "airport": "Lyon-Saint Exupery (LYS)", "model": "Peugeot 3008", "dailyPrice": 68},
    {"id": "car-004", "city": "Marseille", "airport": "Marseille Provence (MRS)", "model": "Citroen C3", "dailyPrice": 47},
    {"id": "car-005", "city": "Nice", "airport": "Nice Cote d Azur (NCE)", "model": "Fiat 500", "dailyPrice": 45},
    {"id": "car-006", "city": "Toulouse", "airport": "Toulouse-Blagnac (TLS)", "model": "Dacia Duster", "dailyPrice": 58},
    {"id": "car-007", "city": "Bordeaux", "airport": "Bordeaux-Merignac (BOD)", "model": "Volkswagen Golf", "dailyPrice": 61},
    {"id": "car-008", "city": "Nantes", "airport": "Nantes Atlantique (NTE)", "model": "Toyota Yaris", "dailyPrice": 54},
]

faq = [
    {"id": "faq-01", "question": "Comment reserver une voiture ?", "answer": "Selectionnez vos dates, choisissez un vehicule puis confirmez votre reservation."},
    {"id": "faq-02", "question": "Quels documents sont necessaires ?", "answer": "Une piece d identite valide, un permis de conduire et une carte bancaire."},
    {"id": "faq-03", "question": "Puis-je annuler ma reservation ?", "answer": "Oui, l annulation est possible selon les conditions affichees dans votre espace client."},
    {"id": "faq-04", "question": "Y a-t-il une caution ?", "answer": "Oui, une pre-autorisation est effectuee au retrait du vehicule."},
    {"id": "faq-05", "question": "Puis-je modifier l horaire de retour ?", "answer": "Oui, depuis votre compte ou via le service client selon disponibilite."},
    {"id": "faq-06", "question": "Le carburant est-il inclus ?", "answer": "Le vehicule est fourni avec un niveau defini et doit etre rendu au meme niveau."},
    {"id": "faq-07", "question": "Puis-je ajouter un conducteur ?", "answer": "Oui, un conducteur additionnel peut etre ajoute lors de la reservation."},
    {"id": "faq-08", "question": "Comment contacter le support ?", "answer": "Utilisez le chat en ligne ou la rubrique contact depuis l accueil."},
    {"id": "faq-09", "question": "Que faire en cas de panne ?", "answer": "Contactez l assistance 24/7 via le numero fourni dans votre contrat."},
    {"id": "faq-10", "question": "Le kilometrage est-il limite ?", "answer": "Selon l offre, un plafond peut s appliquer. Consultez les details de l offre."},
]


@app.get("/health")
def health():
    return {"status": "ok", "service": "product-service"}


@app.get("/cars")
def list_cars():
    return {"items": cars}


@app.get("/faq")
def list_faq():
    return {"items": faq}
