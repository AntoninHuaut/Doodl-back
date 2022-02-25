const rawData = `le rat
le singe
un aigle
un bouc
un canard
un canari
un chameau
un chat
un cheval
un chien
un chimpanzé
un cobra
un coq
un crocodile
un dauphin
un écureuil
un éléphant
un faucon
un hippopotame
un insecte
un kangourou
un lapin
un lion
un loup
un mouton
un oiseau
un ours
un panda
un pélican
un perroquet
un phoque
un pingouin
un poisson
un porc
un renard
un requin
un serpent
un taureau
un tigre
une abeille
une araignée
une fourmi
une girafe
une grenouille
une mouche
une souris
une tortue
une truite`

const data = rawData.split(/\r?\n/).map(line => {
    const word = line.split(" ")[1];
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
});
Deno.writeTextFile("wordList/animals.ts", "export const words = " + JSON.stringify(data));