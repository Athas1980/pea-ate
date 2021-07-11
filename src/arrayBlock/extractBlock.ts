function extractBlock(src_x: number, src_y: number, width: number, height: number, src: Uint8Array, src_width: number):Uint8Array {
    const result = new Uint8Array(width * height);
    const first = src_y * src_width + src_x;
    let index = 0;
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            result[index++] = src[first + i * src_width + j];
        }
    }
    return result;
}

export default extractBlock