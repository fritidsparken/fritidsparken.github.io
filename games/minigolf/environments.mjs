/** Visual art direction only. Authored course coordinates and physics remain untouched. */
export const environments = [
 ['Klassiska parken','park',0,'#789ab0','#e3e4cf','#465e37','#f7deb0',2.5,.82,1.02],
 ['Botaniska trädgården','botanical',0,'#83a9bd','#ecedda','#506b3f','#fff0cf',2.4,.85,1.03],
 ['Japanska trädgården','japanese',0,'#8499ac','#e1d8c7','#45603d','#ffe0af',2.1,.85,1.02],
 ['Skogsbäcken','woodland',0,'#71909a','#cad7c1','#3e5635','#e6e6bd',1.9,.8,1.05],
 ['Medelhavsviken','mediterranean',1,'#579ec2','#e7e6d1','#86845d','#fff0cc',2.8,.85,1],
 ['Tropiska ravinen','jungle',2,'#588e9c','#cee0cc','#35573a','#fbe7be',2.3,.85,1.05],
 ['Kustträdgården','coast',1,'#72a9c1','#e1ebdf','#7e9871','#fff2d6',2.5,.9,1.02],
 ['Slottets kaskader','palace',0,'#82a5ba','#e6e9d7','#547047','#ffe9c4',2.4,.85,1],
 ['Tallarnas bergsstig','mountain',0,'#86afc5','#e4ebdf','#52684d','#f0f0d8',2.5,.9,1.02],
 ['Oasens slingor','oasis',1,'#709ebb','#efdbc0','#bcb19a','#ffe4b2',2.6,.8,1],
 ['Lyktornas trädgård','evening',0,'#283c66','#b89b97','#343f47','#ffb66a',.55,.72,1.15],
 ['Alpbäcken','alpine',0,'#8daabd','#e7e8dd','#667156','#ffe8cb',2.4,.9,1.02],
 ['Månresorten','resort',0,'#7fa8bd','#e3e8df','#64765b','#fff0d4',2.5,.88,1],
 ['Den lysande skogen','enchanted',2,'#172d40','#527778','#233e38','#9cc8d0',.55,.85,1.15],
 ['Portalhamnen','harbour',1,'#7b9ab2','#e3d6c2','#757c70','#ffd3a2',1.5,.85,1.08],
 ['Höstens stengrotta','autumn',0,'#8296a6','#dfcbb2','#77624b','#ffd39b',1.9,.85,1.02],
 ['Nattens lavabro','night',5,'#0c1732','#35465c','#242f3d','#a5b9e2',.6,.88,1.15],
 ['Finalens terrasser','finale',0,'#7e9faf','#e4decc','#557047','#ffe0ac',2.5,.85,1.02]
].map(([name,style,visualWorld,sky,horizon,ground,sun,intensity,ambient,exposure],id)=>({id,name,style,visualWorld,sky,horizon,ground,sun,intensity,ambient,exposure,night:[10,13,16].includes(id),water:[3,4,5,6,7,9,11,12,14,16,17].includes(id)}));
