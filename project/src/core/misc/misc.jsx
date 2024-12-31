import earthart from '../../assets/earthart.jpg';



async function returnBase64TestImg(){
    return await getBase64FromUrl(earthart);
}

const getBase64FromUrl = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the "data:image/jpeg;base64," prefix
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export { returnBase64TestImg, getBase64FromUrl };