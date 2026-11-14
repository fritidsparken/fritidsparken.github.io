// Render the real next-course start once, then free its temporary world geometry.
export async function renderCoursePreview(T,renderer,builders,level){
 if(level>=9){const texture=await new Promise((resolve,reject)=>new T.TextureLoader().load('echo-art/finale-1.webp',resolve,undefined,reject));texture.colorSpace=T.SRGBColorSpace;return {texture,dispose:()=>texture.dispose()};}
 const scene=new T.Scene(),course=builders.createCourse(level+1),cave=builders.buildCave(T,scene,course,level+1,true),rails=builders.buildRails(T,scene,course),cart=builders.buildCart(T),camera=new T.PerspectiveCamera(64,16/9,.08,220),target=new T.WebGLRenderTarget(768,432);
 scene.add(cart.group);
 try{
  await Promise.all([cave.ready,cart.ready]);const sample=course.routeMap.get(course.startRoute).sample(0),p=new T.Vector3(sample.position.x,sample.position.y+.16,sample.position.z),t=new T.Vector3(sample.tangent.x,sample.tangent.y,sample.tangent.z).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),t);
  cart.group.position.copy(p);cart.group.quaternion.copy(q);cart.update(0,0,0,0);builders.createCartCamera(T,camera).update(p,q,'ready',0,false);
  const lamp=new T.SpotLight(0xffd1a0,85,48,.72,.6,1.5),aim=new T.Object3D();lamp.position.copy(p).add(new T.Vector3(0,3,-1).applyQuaternion(q));aim.position.copy(p).addScaledVector(t,14);aim.position.y+=1.5;lamp.target=aim;scene.add(lamp,aim);cave.update(0,p);
  const old=renderer.getRenderTarget();try{renderer.setRenderTarget(target);renderer.render(scene,camera);}finally{renderer.setRenderTarget(old)}
  return {texture:target.texture,dispose:()=>target.dispose()};
 }catch(e){target.dispose();throw e}
 finally{rails.dispose();cave.dispose();cart.dispose();}
}
