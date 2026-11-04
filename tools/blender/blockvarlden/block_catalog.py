"""Source palette and block families. Order is a persistent world-save contract."""
import re
import unicodedata


def slug(label):
    plain = unicodedata.normalize('NFKD', label).encode('ascii', 'ignore').decode()
    return re.sub('[^a-z0-9]+', '-', plain.lower()).strip('-')


def catalog():
    entries = []

    def add(name, family, color, category, **extra):
        entries.append(dict(key=slug(name), name=name, family=family,
                            color='#' + color, category=category, **extra))

    # The first six slots preserve the original quickbar.
    add('Gräs', 'grass', '709854', 'Natur')
    add('Jord', 'earth', '936343', 'Natur')
    add('Sten', 'rock', '89919a', 'Natur')
    add('Ekstock', 'log', '886640', 'Trä')
    add('Eklöv', 'leaf', '53804f', 'Vegetation')
    add('Sand', 'sand', 'ddbf83', 'Natur')
    for name, family, color in (
        ('Grus','gravel','958e81'), ('Lera','earth','ad8a76'), ('Snö','snow','dbe8ec'),
        ('Is','ice','a8d6dc'), ('Mossa','moss','6c8542'), ('Kalksten','strata','b7b5a1'),
        ('Skiffer','strata','636f80'), ('Granit','granite','ad8d85'), ('Basalt','basalt','525865'),
        ('Mörk jord','earth','614831'), ('Våt jord','earth','705845'), ('Torv','peat','765741'),
        ('Podsol','peat','88705a'), ('Morän','gravel','a18c71'), ('Sandsten','strata','d2a77d'),
        ('Röd sand','sand','cf8f5d'), ('Permafrost','snow','b1c3bf'), ('Ängstorv','grass','93ae65'),
        ('Vatten','water','4c9fa8'), ('Lava','lava','dd7540'),
        ('Gnejs','strata','998c90'), ('Dolomit','granite','c1b2a1'),
        ('Krita','rock','d0d1bf'), ('Svart sand','sand','564f54')):
        add(name,family,color,'Natur')
    woods = [('Ek','ac875a','886640'), ('Björk','cfaf80','d0c4ad'), ('Tall','be9369','965e40'),
             ('Gran','a6886d','75614d'), ('Mörkek','806349','705440'), ('Teak','b9774f','965e49'),
             ('Asp','c1af87','929684'), ('Körsbär','c99883','7e584d')]
    for wood, sawn, bark in woods:
        if wood != 'Ek':
            add(wood+'stock', 'log', bark, 'Trä')
        for ending, family in [('plankor','plank'),('bjälke','beam'),('parkett','parquet')]:
            add(wood+ending, family, sawn, 'Trä')
    for name, color in [('Björklöv','81a24f'),('Tallbarr','537957'),('Granbarr','466d5d'),
                        ('Teaklöv','4d845d'),('Asplöv','99ae68'),('Höstlöv','c47e4b'),
                        ('Frostlöv','8daaa6'),('Skymningslöv','9676a6'),
                        ('Lingonris','688151'),('Blåbärsris','647c5f'),('Ormbunke','5f995e'),
                        ('Sjögräs','528878'),('Murgröna','5e794c'),('Vassknippe','978f51')]:
        add(name, 'needle' if 'barr' in name else 'leaf',color,'Vegetation')
    for name, color in [('Kolmalm','423f46'),('Järnmalm','ba8d72'),('Kopparmalm','c17e55'),
                        ('Guldmalm','e4b149'),('Silvermalm','bac5c6'),('Ametiståder','a17fbc'),
                        ('Smaragdåder','5ea785'),('Safiråder','5a94bc'),('Solglimt','f1b45c'),
                        ('Måndagg','a8d1df'),('Glödkvarts','dd8f76'),('Norrskenskristall','70b6aa')]:
        add(name,'ore',color,'Mineraler')
    for name, family, color in [
        ('Rött tegel','brick','b26d56'),('Gult tegel','brick','c19e67'),('Svart tegel','brick','5d595b'),
        ('Kullersten','cobble','94958a'),('Kallmur','cobble','878c85'),('Mursten','brick','9c9788'),
        ('Huggen granit','ashlar','ac9287'),('Huggen kalksten','ashlar','c8bea1'),
        ('Huggen basalt','ashlar','72717a'),('Grön marmor','marble','77968a'),
        ('Vit marmor','marble','cbc7bf'),('Svart marmor','marble','5d606a'),
        ('Takskiffer','roof','737c86'),('Takpannor','roof','b97457'),('Koppartak','roof','88a29a'),
        ('Järnplåt','metal','899499'),('Kopparplåt','metal','bd8c6e'),('Mässingsplåt','metal','c4aa69'),
        ('Fönsterglas','glass','b7d8df'),('Bärnstensglas','glass','d8ac78'),
        ('Havsglas','glass','86b8b5'),('Rökglas','glass','9b98ad'),
        ('Mönstergolv','inlay','ae8a70'),('Stjärngolv','inlay','a89972')]:
        add(name, family,color,'Byggmaterial')
    for color_name, color in [('Korall','ca8071'),('Ockra','cfaa6c'),('Salvia','8ca38b'),
                              ('Havsblå','799db1'),('Lavendel','a998b4'),('Gräddvit','d1c8ad'),
                              ('Kolgrå','75787a'),('Vinröd','a57479')]:
        for kind,family in [('betong','concrete'),('kakel','tile'),('panel','plank')]:
            add(color_name.lower().capitalize()+kind,family,color,'Byggmaterial')
    for name,family,color in [('Arbetsbänk','workbench','997450'),('Förvaringslåda','crate','b58a5f'),
                              ('Odlingsjord','field','74583e'),('Lyktblock','lamp','e9be77'),
                              ('Kristallampa','crystal','90cabf'),('Sollykta','lamp','ebce7e'),
                              ('Stjärnsten','crystal','b39bc8'),('Glödsten','crystal','da9b69'),
                              ('Verktygslåda','crate','92806a')]:
        add(name,family,color,'Specialblock')
    return entries
